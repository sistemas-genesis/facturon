import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { parseStringPromise } from 'xml2js';
import { DailyFileStream } from '../src/logger/daily-file.stream.js';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({ sendMail })),
}));

const root = mkdtempSync(join(tmpdir(), 'facturon-parity-'));
const tenantsDir = join(root, 'tenants');
const logsDir = join(root, 'logs');
process.env.TENANTS_DIR = tenantsDir;
process.env.LOGS_DIR = logsDir;
process.env.PDF_DIR = join(root, 'pdf');
process.env.NODE_ENV = 'test';
process.env.APP_CONFIG_FILE = join(
  process.cwd(),
  'config/app.config.example.json',
);

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), 'test/fixtures', name), 'utf8');
const readLog = (slug: string, prefix = 'app') => {
  try {
    return readFileSync(
      join(logsDir, slug, `${prefix}-${DailyFileStream.today()}.log`),
      'utf8',
    );
  } catch {
    return '';
  }
};
const lines = (slug: string) =>
  readLog(slug)
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
const flush = () => new Promise((r) => setTimeout(r, 200));

/** BD falsa: guarda cada SQL y responde segun el texto. */
const queries: string[] = [];
let respond: (sql: string) => any[] = () => [];
const fakeDriver = {
  connect: async () => ({
    query: async (sql: string) => {
      queries.push(sql);
      return respond(sql);
    },
    close: () => undefined,
  }),
};

const SECRETO_DB = 'DB-PASS-SECRETA-123';
const SECRETO_MAIL = 'MAIL-PASS-SECRETA-456';

describe('paridad funcional con genesis-facturon (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    mkdirSync(tenantsDir, { recursive: true });
    writeFileSync(
      join(tenantsDir, 'pita_nova.json'),
      JSON.stringify({
        slug: 'pita_nova',
        ruc: '1490826722001',
        nombreComercial: 'PITANOVA S.A.',
        db: {
          host: 'localhost',
          port: 4011,
          db: 'pita_nova',
          user: 'dba',
          pass: SECRETO_DB,
        },
        mail: {
          host: 'smtp.example.com',
          port: 25,
          auth: { user: 'facturacion@pitanova.com', pass: SECRETO_MAIL },
        },
        mailsDefault: { manual: false, mail: 'copia@pitanova.com' },
        whatsapp: { phoneNumberId: 'phone-1' },
        firma: { path: '', pass: '', add: 730, avisar_desde_dia: 10 },
        leyenda_catastro: { status: true, key: '.', size: 10, breakLine: '/' },
      }),
    );
    const { AppModule } = await import('../src/app.module.js');
    const { configureApp } = await import('../src/app.setup.js');
    const { DbDriver } = await import('../src/database/sybase.service.js');
    const { SriClient } = await import('../src/uploader/sri-client.service.js');
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DbDriver)
      .useValue(fakeDriver)
      .overrideProvider(SriClient)
      .useValue({
        comprobante: async () => parseStringPromise(fixture('factura.xml')),
      })
      .compile();
    app = mod.createNestApplication<NestExpressApplication>();
    configureApp(app as NestExpressApplication);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    queries.length = 0;
    respond = () => [];
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: '<abc@x>' });
    vi.unstubAllGlobals();
  });

  describe('Documentos', () => {
    const body = {
      empresas: ',1490826722001,',
      estacion: ',',
      punto: ',',
      tipos: ',FV,NC,',
      params: { fecha_autorizacion: true },
    };

    it('POST /api/documento/:cedula&:start&:end&:db -> 200 con las filas y SQL equivalente', async () => {
      respond = () => [{ ce_id: 1, clave_acceso: 'X' }];
      const res = await http()
        .post('/api/documento/1234567890&2024-10-01&2024-10-31&pita_nova')
        .send(body)
        .expect(200);
      expect(res.body).toEqual([{ ce_id: 1, clave_acceso: 'X' }]);
      const sql = queries[0];
      expect(sql).toContain("ruc_comprador = '1234567890'");
      expect(sql).toContain("SUBSTR('1234567890',0,11)");
      expect(sql).toContain("'1234567890' + '001'");
      expect(sql).toContain('estado = 4');
      expect(sql).toContain("DATE(fecha_autorizacion) >= '2024-10-01'");
      expect(sql).toContain("'9999999999999'");
      expect(sql).toContain("',FV,NC,' LIKE '%,'+tipo_comprobante+',%'");
    });

    it('usa fecha_comprobante cuando fecha_autorizacion es falso', async () => {
      await http()
        .post('/api/documento/1234567890&2024-10-01&2024-10-31&pita_nova')
        .send({ ...body, params: { fecha_autorizacion: false } })
        .expect(200);
      expect(queries[0]).toContain('DATE(fecha_comprobante) >=');
    });

    it('escapa comillas: no permite inyeccion SQL por la ruta ni el body', async () => {
      await http()
        .post(
          `/api/documento/${encodeURIComponent("x' OR '1'='1")}&2024-10-01&2024-10-31&pita_nova`,
        )
        .send({ ...body, tipos: "FV'; DROP TABLE ce_comprobante;--" })
        .expect(200);
      expect(queries[0]).toContain("'x'' OR ''1''=''1'");
      expect(queries[0]).toContain("'FV''; DROP TABLE");
    });

    it('POST /api/documentoLike/:start&:end&:db', async () => {
      respond = () => [{ ce_id: 2 }];
      const res = await http()
        .post('/api/documentoLike/2024-10-01&2024-10-31&pita_nova')
        .send(body)
        .expect(200);
      expect(res.body).toEqual([{ ce_id: 2 }]);
      expect(queries[0]).not.toContain('estado = 4');
    });

    it('rechaza un body sin los campos obligatorios (400) y una BD desconocida (404)', async () => {
      await http()
        .post('/api/documento/1&2024-10-01&2024-10-31&pita_nova')
        .send({})
        .expect(400);
      await http()
        .post('/api/documentoLike/2024-10-01&2024-10-31&no_existe')
        .send(body)
        .expect(404);
    });

    it('GET /api/getXmlById/:db/:id sanea el XML y responde application/xml', async () => {
      respond = () => [{ ce_xml: '<a>x \u0000 &amp; & y\u0001</a>' }];
      const res = await http().get('/api/getXmlById/pita_nova/10').expect(200);
      expect(res.headers['content-type']).toContain(
        'application/xml; charset=utf-8',
      );
      expect(res.text).toBe('<a>x  &amp; &amp; y</a>');
      expect(queries[0]).toBe(
        'SELECT TOP 1 ce_xml FROM ce_comprobante WHERE ce_id = 10',
      );
    });

    it('getXmlById: 404 {success:false,msg} sin XML; 500 con el mismo formato ante fallo de BD; 400 si el id no es numerico', async () => {
      respond = () => [];
      const nf = await http().get('/api/getXmlById/pita_nova/10').expect(404);
      expect(nf.body).toEqual({ success: false, msg: 'XML no disponible' });
      respond = () => {
        throw new Error('db caida');
      };
      const err = await http().get('/api/getXmlById/pita_nova/10').expect(500);
      expect(err.body.success).toBe(false);
      await http().get('/api/getXmlById/pita_nova/1%20OR%201=1').expect(400);
    });
  });

  describe('RIDE + PDF', () => {
    const casos: [string, string, string][] = [
      [
        'factura',
        'factura.xml',
        '0110202401149082672200120010010000001231234567818',
      ],
      [
        'retencion',
        'retencion.xml',
        '0110202407149082672200120010010000001231234567816',
      ],
      [
        'retencion2',
        'retencion2.xml',
        '0110202407149082672200120010010000001231234567817',
      ],
      [
        'credito',
        'credito.xml',
        '0110202404149082672200120010010000001231234567815',
      ],
      [
        'debito',
        'debito.xml',
        '0110202405149082672200120010010000001231234567814',
      ],
      [
        'remision',
        'remision.xml',
        '0110202406149082672200120010010000001231234567813',
      ],
      [
        'liquidacion',
        'liquidacion.xml',
        '0110202403149082672200120010010000001231234567812',
      ],
    ];

    it.each(casos)(
      'POST /api/documento/ride/%s -> 200 con el nombre del PDF; /api/pdf/:file lo descarga',
      async (tipo, xml, clave) => {
        const res = await http()
          .post(`/api/documento/ride/${tipo}/2024-10-01T10:00:00`)
          .send({ xml: fixture(xml) })
          .expect(200);
        expect(res.text).toBe(`${clave}.pdf`);
        const pdf = await http()
          .get(`/api/pdf/${res.text}`)
          .buffer(true)
          .parse((r, cb) => {
            const chunks: Buffer[] = [];
            r.on('data', (c: Buffer) => chunks.push(c));
            r.on('end', () => cb(null, Buffer.concat(chunks)));
          })
          .expect(200);
        expect(pdf.headers['content-type']).toContain('application/pdf');
        expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
      },
    );

    it('registra en el log de la empresa emisora (por RUC del XML): nombre, RUC, accion y resultado', async () => {
      await http()
        .post('/api/documento/ride/factura/2024-10-01T10:00:00')
        .send({ xml: fixture('factura.xml') })
        .expect(200);
      await flush();
      const op = lines('pita_nova').find(
        (l) => l.event === 'empresa.operacion' && l.accion === 'ride.factura',
      );
      expect(op).toMatchObject({
        tenant: 'pita_nova',
        empresaRuc: '1490826722001',
        empresaNombre: 'PITANOVA S.A.',
        accion: 'ride.factura',
        resultado: 'ok',
      });
      expect(op.requestId).toBeTruthy();
      expect(op.time).toBeTruthy();
      const req = lines('pita_nova').find(
        (l) => l.event === 'http.request' && l.path.includes('ride/factura'),
      );
      expect(req).toMatchObject({
        empresaRuc: '1490826722001',
        empresaNombre: 'PITANOVA S.A.',
      });
    });

    it('errores: XML invalido 400; tipo equivocado 500; RUC sin empresa 500; body sin xml 400', async () => {
      await http()
        .post('/api/documento/ride/factura/2024')
        .send({ xml: 'no es xml' })
        .expect(400);
      await http()
        .post('/api/documento/ride/credito/2024')
        .send({ xml: fixture('factura.xml') })
        .expect(500);
      await http()
        .post('/api/documento/ride/factura/2024')
        .send({
          xml: fixture('factura.xml').replace('1490826722001', '1799999999001'),
        })
        .expect(500);
      await http()
        .post('/api/documento/ride/factura/2024')
        .send({})
        .expect(400);
    });

    it('GET /api/pdf no sirve archivos fuera de la carpeta de PDF', async () => {
      await http().get('/api/pdf/..%2F..%2Fetc%2Fpasswd').expect(404);
      await http().get('/api/pdf/%2Fetc%2Fpasswd').expect(404);
      await http().get('/api/pdf/noexiste.pdf').expect(404);
    });
  });

  describe('Mail', () => {
    const rowFactura = () => ({
      ce_xml: fixture('factura.xml'),
      fecha_autorizacion: '2024-10-01T10:00:00',
      numero_autorizacion: 'A',
      xml_autorizado: '<autorizacion/>',
      nombre_comprador: 'JUAN PEREZ',
      empresa: 1,
      telefono: '0991234567',
    });

    it('GET /api/mail/:db/:ce_id/:mails envia correo con PDF+XML, WhatsApp y marca email = 1', async () => {
      respond = (sql) => (sql.includes('SELECT') ? [rowFactura()] : []);
      const fetchMock = vi.fn(async (url: string) =>
        url.includes('/phones/token/')
          ? { ok: true, json: async () => ({ token: 'tok-wa' }) }
          : { ok: true, json: async () => ({}) },
      );
      vi.stubGlobal('fetch', fetchMock);

      await http()
        .get('/api/mail/pita_nova/10/cliente@example.com,otro@example.com')
        .expect(200);

      expect(sendMail).toHaveBeenCalledTimes(1);
      const opts = sendMail.mock.calls[0][0];
      expect(opts.from).toBe('facturacion@pitanova.com');
      expect(opts.to).toEqual(['cliente@example.com', 'otro@example.com']);
      expect(opts.subject).toBe(
        '📝 FACTURA - JUAN PEREZ, FACTURACIÓN ELECTRÓNICA 001-001-000000123',
      );
      expect(opts.html).toContain('JUAN PEREZ');
      expect(opts.html).toContain('01-10-2024');
      expect(opts.html).toContain('115.00');
      expect(opts.attachments.map((a: any) => a.filename)).toEqual([
        '001-001-000000123.pdf',
        '001-001-000000123.xml',
      ]);
      // WhatsApp: token + envio con telefono normalizado a 593...
      const send = fetchMock.mock.calls.find(([u]) =>
        u.endsWith('/messages/send'),
      )!;
      expect(JSON.parse((send[1] as any).body).jid).toBe(
        '593991234567@s.whatsapp.net',
      );
      expect((send[1] as any).headers.Authorization).toBe('Bearer tok-wa');
      expect(queries.at(-1)).toBe(
        'UPDATE ce_comprobante SET email = 1 WHERE ce_id = 10',
      );

      await flush();
      const ok = lines('pita_nova').find(
        (l) => l.accion === 'mail.enviar' && l.resultado === 'ok',
      );
      expect(ok).toMatchObject({
        empresaRuc: '1490826722001',
        empresaNombre: 'PITANOVA S.A.',
        comprobante: '001-001-000000123',
        destinatarios: 2,
      });
    });

    it('un fallo de entrega responde 200 (como el legacy), queda como error en el log y no filtra credenciales', async () => {
      respond = (sql) => (sql.includes('SELECT') ? [rowFactura()] : []);
      sendMail.mockRejectedValue(new Error('SMTP caido'));
      await http()
        .get('/api/mail/pita_nova/11/cliente@example.com')
        .expect(200);
      await flush();
      expect(readLog('pita_nova', 'error')).toContain('SMTP caido');
      const all = readLog('pita_nova');
      expect(all).not.toContain(SECRETO_MAIL);
      expect(all).not.toContain(SECRETO_DB);
    });

    it('comprobante inexistente -> 404; destinatario 501 -> omitido y 200', async () => {
      respond = () => [];
      await http().get('/api/mail/pita_nova/12/a@b.com').expect(404);
      respond = (sql) => (sql.includes('SELECT') ? [rowFactura()] : []);
      sendMail.mockRejectedValue(
        Object.assign(new Error('bad'), { responseCode: 501 }),
      );
      await http().get('/api/mail/pita_nova/13/a@b.com').expect(200);
    });

    it('rechaza ce_id no numerico (400) sin tocar la BD', async () => {
      await http().get('/api/mail/pita_nova/1%20OR%201=1/a@b.com').expect(400);
      expect(queries).toHaveLength(0);
    });
  });

  describe('Genesis / Uploader / Gasolinera / Params / Firma / Web', () => {
    it('genesis/ride genera el PDF (200 vacio); ride_blob devuelve el PDF en base64; sin registro -> 500', async () => {
      respond = () => [
        {
          ce_xml: fixture('factura.xml'),
          fecha_autorizacion: '2024-10-01T10:00:00',
        },
      ];
      const r1 = await http()
        .get('/api/genesis/ride/pita_nova/CLAVE1/')
        .expect(200);
      expect(r1.text).toBe('');
      const r2 = await http()
        .get('/api/genesis/ride_blob/pita_nova/CLAVE1/')
        .expect(200);
      expect(Buffer.from(r2.text, 'base64').subarray(0, 5).toString()).toBe(
        '%PDF-',
      );
      respond = () => [];
      await http().get('/api/genesis/ride/pita_nova/NOEXISTE/').expect(500);
    });

    it('getFacturaCompraIndividual responde 200 vacio y registra en BD cabecera + movimientos (SQL escapado)', async () => {
      await http()
        .get('/api/getFacturaCompraIndividual/pita_nova/55/CLAVE49')
        .expect(200, '');
      await flush();
      const sql = queries.find((q) => q.includes('in_cabecera_xml_temp'))!;
      expect(sql).toContain(
        'INSERT INTO in_cabecera_xml_temp(sesion, clave_acceso, fecha_autoriza',
      );
      expect(sql).toContain("'2024-10-01'");
      expect(sql).toContain('INSERT INTO in_movimiento_xml_temp');
      expect(sql).toContain('detadicional');
      expect(
        lines('pita_nova').find(
          (l) => l.accion === 'uploader.compraIndividual',
        ),
      ).toMatchObject({
        resultado: 'ok',
        empresaNombre: 'PITANOVA S.A.',
      });
      await http()
        .get('/api/getFacturaCompraIndividual/pita_nova/5%205/CLAVE49')
        .expect(400);
    });

    it('getFacturaVentaIndividual usa los datos del comprador', async () => {
      await http()
        .get('/api/getFacturaVentaIndividual/pita_nova/56/CLAVE49')
        .expect(200);
      await flush();
      const sql = queries.find((q) => q.includes('in_cabecera_xml_temp'))!;
      expect(sql).toContain("'JUAN PEREZ & HIJOS'");
      expect(sql).toContain("'1234567890'");
    });

    it('getFacturaCompra lee el archivo de la sesion, actualiza length y procesa las facturas', async () => {
      const clave = '0110202401149082672200120010010000001231234567818'; // 49
      const aut = '1234567890123456789012345678901234567'; // 37
      respond = (sql) =>
        sql.includes('SELECT archivo')
          ? [
              {
                archivo: `x\t${clave}\t${aut}\r\ny\t0110202407149082672200120010010000001231234567818\t${aut}\n`,
              },
            ]
          : [];
      await http().get('/api/getFacturaCompra/pita_nova/77').expect(200, '');
      await flush();
      expect(
        queries.some(
          (q) =>
            q === 'UPDATE archivo_txt SET length = 1 WHERE sesion = 77;commit;',
        ),
      ).toBe(true);
      expect(
        queries.filter((q) => q.includes('INSERT INTO in_cabecera_xml_temp')),
      ).toHaveLength(1);
    });

    it('persona: consulta Genesis e inserta en cliente2 (200 vacio); Genesis caido -> 502', async () => {
      const get = vi
        .spyOn(axios, 'get')
        .mockResolvedValue({
          data: { cedula_ruc: '1234567890', nombre: "O'BRIEN" },
        });
      await http().get('/api/persona/pita_nova/1234567890').expect(200, '');
      expect(get.mock.calls[0][0]).toBe(
        'http://genesis.example.com:2001/persona/1234567890',
      );
      expect(queries[0]).toBe(
        "INSERT INTO cliente2(cedula_ruc,razon_social) VALUES ('1234567890', 'O''BRIEN')",
      );
      get.mockRejectedValue(new Error('down'));
      await http().get('/api/persona/pita_nova/1234567890').expect(502);
      get.mockRestore();
    });

    it('params: empresas (sin credenciales), publicip, config del panel (sin clave, local; contrasenas siempre enmascaradas)', async () => {
      const emp = await http().get('/api/params/empresas').expect(200);
      expect(emp.body[0]).toMatchObject({
        db: 'pita_nova',
        ruc: '1490826722001',
        empresa: 'PITANOVA S.A.',
        avisar_desde_dia: 10,
        mailsDefault: { manual: false, mail: 'copia@pitanova.com' },
      });
      expect(JSON.stringify(emp.body)).not.toContain(SECRETO_DB);
      await http().get('/api/params/publicip').expect(200);
      // ruta legacy eliminada: cae al fallback del front (HTML), sin config
      const legacy = await http().get(`/api/params/login/cualquiera`);
      expect(legacy.type).toBe('text/html');
      expect(legacy.text).not.toContain('databases');
      const ok = await http().get('/api/params/config').expect(200);
      expect(ok.body.databases[0]).toMatchObject({
        db: 'pita_nova',
        user: 'dba',
        pass: '********',
      });
      expect(JSON.stringify(ok.body)).not.toContain(SECRETO_DB);
      expect(JSON.stringify(ok.body)).not.toContain(SECRETO_MAIL);
    });

    it('firma: sin firma configurada -> 200 vacio; empresa inexistente -> 404; info con archivo invalido -> {success:false,msg}', async () => {
      await http()
        .get('/api/firma/fecha_caducidad/1490826722001')
        .expect(200, '');
      await http().get('/api/firma/fecha_caducidad/1799999999001').expect(404);
      const bad = await http()
        .post('/api/firma/info')
        .send({ firma: 'data:x;base64,AAAA', pass: 'x' })
        .expect(200);
      expect(bad.body.success).toBe(false);
      expect(typeof bad.body.msg).toBe('string');
      const nofile = await http()
        .post('/api/firma/info')
        .send({ firma: 'sin-coma', pass: 'x' })
        .expect(200);
      expect(nofile.body).toEqual({
        success: false,
        msg: 'Archivo de firma invalido',
      });
    });

    it('web: /config y cualquier otra ruta GET devuelven el front; estaticos servidos', async () => {
      const cfg = await http().get('/config').expect(200);
      expect(cfg.text).toContain('config');
      const idx = await http().get('/cualquier/ruta').expect(200);
      expect(idx.text).toContain('<html');
      await http().get('/main.js').expect(200);
    });
  });
});
