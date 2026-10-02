import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseConfig, envFromServerJson } from './app-config.js';
import { appJsonSchema, loadAppJson } from './app-json.js';

const example = join(process.cwd(), 'config/app.config.example.json');

describe('config/app.config.json', () => {
  it('el ejemplo es valido y trae todo lo global del legacy (soap, tablas, catalogos SRI, plantilla de correo)', () => {
    const json = loadAppJson(example);
    const d = json.defaults;
    expect(d.soap).toContain('AutorizacionComprobantesOffline');
    expect(d.tables).toEqual({
      file: 'archivo_txt',
      cabecera: 'in_cabecera_xml_temp',
      movimiento: 'in_movimiento_xml_temp',
    });
    expect(d.sri.codDocSustento['01']).toBe('FACTURA');
    expect(d.sri.tarifaIVA['4']).toBe('15%');
    expect(d.ride.mailTemplate).toContain('%tipo_comprobante%');
  });

  it('los valores de "server" alimentan AppConfig y el entorno los sobrescribe', () => {
    const json = loadAppJson(example);
    const base = envFromServerJson(json.server);
    expect(parseConfig({ ...base, NODE_ENV: 'test' }).port).toBe(3090);
    expect(parseConfig({ ...base, PORT: '4000' }).port).toBe(4000);
  });

  it('por defecto escucha solo en 127.0.0.1 (host configurable) y no hay claves de admin', () => {
    const json = loadAppJson(example);
    expect(json.server.host).toBe('127.0.0.1');
    const base = envFromServerJson(json.server);
    expect(parseConfig(base).host).toBe('127.0.0.1');
    expect(parseConfig({ ...base, API_HOST: '0.0.0.0' }).host).toBe('0.0.0.0');
    // sin ningun valor ni variable sigue siendo local
    expect(parseConfig({}).host).toBe('127.0.0.1');
    expect(appJsonSchema.shape.server._def.innerType.shape).not.toHaveProperty(
      'adminApiKey',
    );
  });

  it('el servidor no acepta claves de acceso remoto en el JSON (adminApiKey, corsOrigins)', () => {
    const json = JSON.parse(JSON.stringify(loadAppJson(example)));
    for (const extra of [{ adminApiKey: 'x'.repeat(20) }, { corsOrigins: [] }])
      expect(
        appJsonSchema.safeParse({
          ...json,
          server: { ...json.server, ...extra },
        }).success,
      ).toBe(false);
  });

  it('rechaza campos desconocidos y valores invalidos, indicando cual', () => {
    const json = JSON.parse(JSON.stringify(loadAppJson(example)));
    expect(appJsonSchema.safeParse({ ...json, typo: 1 }).success).toBe(false);
    const bad = appJsonSchema.safeParse({ ...json, defaults: { ...json.defaults, soap: 'no-es-url' } });
    expect(bad.success).toBe(false);
  });

  it('archivo inexistente o con JSON roto: error claro que no cita el contenido', () => {
    expect(() => loadAppJson('/no/existe.json')).toThrow(/no existe/);
    const dir = mkdtempSync(join(tmpdir(), 'cfg-'));
    const f = join(dir, 'x.json');
    writeFileSync(f, '{"adminApiKey":"SECRETO-QUE-NO-DEBE-SALIR" basura');
    try {
      loadAppJson(f);
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain('JSON invalido');
      expect((e as Error).message).not.toContain('SECRETO-QUE-NO-DEBE-SALIR');
    }
  });
});
