import {
  Controller,
  Get,
  INestApplication,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { DailyFileStream } from '../src/logger/daily-file.stream.js';

const root = mkdtempSync(join(tmpdir(), 'facturon-e2e-'));
const tenantsDir = join(root, 'tenants');
const logsDir = join(root, 'logs');
process.env.TENANTS_DIR = tenantsDir;
process.env.LOGS_DIR = logsDir;
process.env.NODE_ENV = 'test';
process.env.APP_CONFIG_FILE = join(
  process.cwd(),
  'config/app.config.example.json',
);
process.env.PDF_DIR = join(root, 'pdf');

const tenant = (slug: string, dbName: string, extra: object = {}) => ({
  slug,
  ruc: '1790000000001',
  nombreComercial: slug.toUpperCase(),
  db: {
    host: 'localhost',
    port: 4011,
    db: dbName,
    user: 'dba',
    pass: 'super-secreto',
  },
  ...extra,
});
const today = () => DailyFileStream.today();
const readLog = (slug: string, prefix = 'app') => {
  try {
    return readFileSync(
      join(logsDir, slug, `${prefix}-${today()}.log`),
      'utf8',
    );
  } catch {
    return '';
  }
};

describe('aislamiento por empresa (e2e)', () => {
  let app: INestApplication;
  let TenantGuard: any;
  let TenantLoggerService: any;

  beforeAll(async () => {
    mkdirSync(tenantsDir, { recursive: true });
    writeFileSync(
      join(tenantsDir, 'alfa.json'),
      JSON.stringify(tenant('alfa', 'bd_alfa')),
    );
    writeFileSync(
      join(tenantsDir, 'beta.json'),
      JSON.stringify(
        tenant('beta', 'bd_beta', {
          tables: { file: 'f_beta', cabecera: 'c_beta', movimiento: 'm_beta' },
        }),
      ),
    );
    // dos empresas con el mismo nombre de BD => ambiguo
    writeFileSync(
      join(tenantsDir, 'gama1.json'),
      JSON.stringify(tenant('gama1', 'bd_repetida')),
    );
    writeFileSync(
      join(tenantsDir, 'gama2.json'),
      JSON.stringify(tenant('gama2', 'bd_repetida')),
    );
    writeFileSync(join(tenantsDir, 'rota.json'), '{ esto no es json');

    ({ TenantGuard } = await import('../src/tenants/tenant.guard.js'));
    ({ TenantLoggerService } =
      await import('../src/logger/tenant-logger.service.js'));
    const { AppModule } = await import('../src/app.module.js');

    @Controller('api/demo')
    class DemoController {
      constructor(private readonly logger: any) {}
      @UseGuards(TenantGuard)
      @Get(':db/hola')
      hola(@Param('db') db: string) {
        this.logger.info('hola desde servicio', {
          db,
          pass: 'no-debe-salir',
          nested: { token: 'tampoco' },
          deep: { a: { pass: 'profundo-no-sale' } },
        });
        return { ok: true };
      }
      @UseGuards(TenantGuard)
      @Get(':db/falla')
      falla() {
        throw new Error('boom de prueba');
      }
    }
    Reflect.defineMetadata(
      'design:paramtypes',
      [TenantLoggerService],
      DemoController,
    );

    const mod = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [DemoController],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('una empresa invalida no tumba a las demas', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.tenants.total).toBe(4);
  });

  it('cada empresa escribe solo en su log', async () => {
    await request(app.getHttpServer())
      .get('/api/demo/bd_alfa/hola')
      .expect(200);
    await new Promise((r) => setTimeout(r, 150));
    expect(readLog('alfa')).toContain('hola desde servicio');
    expect(readLog('beta')).not.toContain('hola desde servicio');
  });

  it('no registra secretos', async () => {
    const log = readLog('alfa');
    expect(log).toContain('[REDACTED]');
    expect(log).not.toContain('no-debe-salir');
    expect(log).not.toContain('tampoco');
    expect(log).not.toContain('profundo-no-sale');
  });

  it('el selector es :db y no hay claves: sin cabeceras de acceso entra y cada una queda en su log', async () => {
    await request(app.getHttpServer())
      .get('/api/demo/bd_beta/hola')
      .expect(200);
    // un X-Api-Key / X-Tenant ajeno ya no cambia a que empresa se atiende
    await request(app.getHttpServer())
      .get('/api/demo/bd_alfa/hola')
      .set('X-Api-Key', 'key-beta-1234567890')
      .set('X-Tenant', 'beta')
      .expect(200);
    await new Promise((r) => setTimeout(r, 150));
    expect(readLog('beta')).toContain('hola desde servicio');
    const alfa = readLog('alfa');
    expect(alfa.match(/hola desde servicio/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('una empresa no ve la config de otra: tablas propias vs defaults', async () => {
    const { TenantRegistry } =
      await import('../src/tenants/tenant-registry.service.js');
    const { TenantSettings } =
      await import('../src/tenants/tenant-settings.service.js');
    const reg = app.get(TenantRegistry);
    const settings = app.get(TenantSettings);
    const alfa = reg.getBySlug('alfa')!;
    const beta = reg.getBySlug('beta')!;
    expect(settings.for(beta).tables.cabecera).toBe('c_beta');
    expect(settings.for(alfa).tables.cabecera).toBe('in_cabecera_xml_temp');
    // :db resuelve exactamente a su empresa
    expect(reg.findByDb('bd_alfa').map((t: any) => t.slug)).toEqual(['alfa']);
  });

  it('db ambigua o inexistente => 404 generico', async () => {
    await request(app.getHttpServer())
      .get('/api/demo/bd_repetida/hola')
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/demo/no_existe/hola')
      .expect(404);
  });

  it('un error queda en error-<fecha>.log de SU empresa con stack', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/demo/bd_alfa/falla')
      .expect(500);
    expect(res.body.message).toBe('Error interno del servidor'); // no filtra detalles al cliente
    await new Promise((r) => setTimeout(r, 150));
    expect(readLog('alfa', 'error')).toContain('boom de prueba');
    expect(readLog('beta', 'error')).not.toContain('boom de prueba');
  });

  it('ya no existe /admin ni /api/params/login: no hay datos de empresas ahi', async () => {
    await request(app.getHttpServer()).post('/admin/tenants').expect(404);
    await request(app.getHttpServer()).put('/admin/tenants/alfa/log-level').expect(404);
    const res = await request(app.getHttpServer()).get('/admin/tenants');
    expect(res.headers['content-type']).toContain('text/html'); // cae en el front, no en una API
    expect(res.text).not.toContain('super-secreto');
  });

  it('el panel /api/params/config funciona sin clave y nunca expone contrasenas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/params/config')
      .expect(200);
    expect(res.body.host).toBe('127.0.0.1');
    expect(res.body.tables.file).toBe('archivo_txt');
    expect(JSON.stringify(res.body)).not.toContain('super-secreto');
    expect(
      res.body.databases.find((d: any) => d.slug === 'beta').overrides.tables,
    ).toEqual({ file: 'f_beta', cabecera: 'c_beta', movimiento: 'm_beta' });
  });

  it('un JSON roto no filtra su contenido (credenciales) en el log', async () => {
    const { TenantRegistry } =
      await import('../src/tenants/tenant-registry.service.js');
    writeFileSync(
      join(tenantsDir, 'filtra.json'),
      '{"db":{"pass":"PASS-FILTRADO-XYZ"} basura',
    );
    const out = app.get(TenantRegistry).reload();
    expect(JSON.stringify(out.errors)).toContain('filtra.json');
    expect(JSON.stringify(out.errors)).not.toContain('PASS-FILTRADO-XYZ');
    await new Promise((r) => setTimeout(r, 150));
    expect(readLog('_system')).not.toContain('PASS-FILTRADO-XYZ');
  });
});
