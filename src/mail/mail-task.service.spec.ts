import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MailTaskService } from './mail-task.service.js';

const xml = (n: string) =>
  readFileSync(join(process.cwd(), 'test/fixtures', n), 'utf8');

function setup(rows: any[], enviar: (...a: any[]) => Promise<void>) {
  const tenant: any = {
    slug: 'pita',
    enabled: true,
    ruc: '1490826722001',
    nombreComercial: 'PITANOVA',
    db: { db: 'pita' },
    mailsDefault: { manual: false, mail: 'copia@x.com' },
  };
  const registry: any = {
    getBySlug: () => tenant,
    selectByRuc: () => tenant,
    distinctDatabases: () => [tenant],
  };
  const queries: string[] = [];
  const db: any = {
    query: async (_t: any, sql: string) => (queries.push(sql), rows),
  };
  const logs: any[] = [];
  const logger: any = {
    audited: async (_t: any, _a: string, fn: any) => fn(),
    operation: (_t: any, accion: string, resultado: string, meta: any) =>
      logs.push({ accion, resultado, ...meta }),
  };
  const mail: any = {
    enviar: vi.fn(enviar),
    markSent: vi.fn(async () => undefined),
  };
  const svc = new MailTaskService(
    {
      for: () => ({
        mailTask: {
          status: true,
          frequency: '* * * * *',
          lastComprobantesDays: 3,
          top: 10,
        },
      }),
    } as never,
    registry,
    {} as never,
    db,
    mail,
    logger,
  );
  return { svc, mail, queries, logs };
}
const cfg = {
  status: true,
  frequency: '* * * * *',
  lastComprobantesDays: 3,
  top: 10,
};

describe('MailTaskService.tick (utilities.task del legacy)', () => {
  it('consulta TOP n pendientes y envia con copia por defecto de la empresa emisora', async () => {
    const { svc, mail, queries } = setup(
      [{ ce_id: 7, ce_xml: xml('factura.xml'), ruc_emisor: '1490826722001' }],
      async () => undefined,
    );
    await svc.tick('pita', cfg);
    expect(queries[0]).toContain('SELECT TOP 10 ce_id');
    expect(queries[0]).toContain(
      'estado = 4 AND email = 0 and fecha_autorizacion > today()-3',
    );
    expect(mail.enviar).toHaveBeenCalledWith(
      expect.anything(),
      '7',
      'cliente@example.com,copia@x.com',
      expect.objectContaining({ correlationId: expect.any(String) }),
    );
  });

  it('sin correo en el comprobante => enviar() sin correos (solo WhatsApp) que lo marca enviado', async () => {
    const sinMail = xml('factura.xml').replace(
      /<infoAdicional>.*<\/infoAdicional>/s,
      '',
    );
    const { svc, mail } = setup(
      [{ ce_id: 8, ce_xml: sinMail, ruc_emisor: '1490826722001' }],
      async () => undefined,
    );
    await svc.tick('pita', cfg);
    expect(mail.enviar).toHaveBeenCalledWith(
      expect.anything(),
      '8',
      '',
      expect.anything(),
    );
  });

  it('si el envio falla se marca enviado (igual que el legacy) y se sigue con el siguiente', async () => {
    const { svc, mail } = setup(
      [
        { ce_id: 1, ce_xml: xml('factura.xml'), ruc_emisor: 'x' },
        { ce_id: 2, ce_xml: xml('factura.xml'), ruc_emisor: 'x' },
      ],
      async () => {
        throw new Error('boom');
      },
    );
    await svc.tick('pita', cfg);
    expect(mail.enviar).toHaveBeenCalledTimes(2);
    expect(mail.markSent).toHaveBeenCalledTimes(2);
  });

  it('XML sin infoTributaria se informa como error y no se marca', async () => {
    const { svc, mail, logs } = setup(
      [{ ce_id: 3, ce_xml: '<factura><x/></factura>', ruc_emisor: 'x' }],
      async () => undefined,
    );
    await svc.tick('pita', cfg);
    expect(mail.markSent).not.toHaveBeenCalled();
    expect(logs[0]).toMatchObject({
      accion: 'mailtask.comprobante',
      resultado: 'error',
      ceId: 3,
    });
  });
});
