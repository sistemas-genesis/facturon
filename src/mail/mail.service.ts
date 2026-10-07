import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import moment from 'moment';
import { createTransport } from 'nodemailer';
import { getValorFromXml, parseXml, tipoFromXml } from '../common/sri-xml.js';
import { sqlInt } from '../database/sql.util.js';
import { Row, SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { RideService } from '../ride/ride.service.js';
import { WhatsAppService, type WhatsAppResult } from './whatsapp.service.js';

export interface EnvioContext {
  /** Id para correlacionar los registros de una misma ejecucion (tarea programada). */
  correlationId?: string;
}

@Injectable()
export class MailService {
  constructor(
    private readonly settings: TenantSettings,
    private readonly db: SybaseService,
    private readonly registry: TenantRegistry,
    private readonly tenantContext: TenantContext,
    private readonly ride: RideService,
    private readonly whatsapp: WhatsAppService,
    private readonly logger: TenantLoggerService,
  ) {}

  /**
   * Envia por correo (y WhatsApp si hay telefono y token) el comprobante `ceId` de la BD de
   * `dbTenant`, firmado con las credenciales de la empresa EMISORA (RUC del XML), y marca
   * ce_comprobante.email = 1. Mismo flujo que GET /api/mail/:db/:ce_id/:mails del legacy.
   */
  async enviar(
    dbTenant: Tenant,
    ceId: string,
    mails: string,
    ctx: EnvioContext = {},
  ): Promise<void> {
    const id = sqlInt(ceId, 'ce_id');
    const corr = ctx.correlationId ? { correlationId: ctx.correlationId } : {};
    const query = this.comprobanteQuery(id);

    await this.db.withConnection(dbTenant, async (conn) => {
      const rows = await conn.query<Row>(query);
      const row = rows[0];
      if (!row) {
        this.logger.operation(dbTenant, 'mail.enviar', 'error', {
          ceId: id,
          motivo: 'comprobante no encontrado',
          ...corr,
        });
        throw new NotFoundException('Comprobante no encontrado');
      }

      const xml = await parseXml(row.ce_xml);
      const root = Object.keys(xml)[0];
      const tipo = tipoFromXml(xml);
      const it = xml[root].infoTributaria[0];
      // la empresa que envia es la dueña del RUC emisor del XML
      const emisor = this.registry.selectByRuc(it.ruc[0]) ?? dbTenant;
      this.tenantContext.bind(emisor);
      const secuencial = `${it.estab[0]}-${it.ptoEmi[0]}-${it.secuencial[0]}`;
      const base = {
        ceId: id,
        tipo,
        comprobante: secuencial,
        baseDatos: dbTenant.db.db,
        ...corr,
      };
      const started = Date.now();

      let pdfPath: string;
      try {
        if (!tipo) throw new Error(`Tipo de comprobante no soportado: ${root}`);
        if (!emisor.mail)
          throw new Error('La empresa no tiene configurado el bloque "mail"');

        pdfPath = (
          await this.ride.generate(tipo, row.ce_xml, row.fecha_autorizacion)
        ).path;

        const mailCfg = await this.resolveTransport(emisor.mail);
        const to = mails
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);
        const html = this.renderHtml(emisor, row, xml, tipo);
        const attachments: any[] = [
          {
            filename: `${secuencial}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf',
          },
        ];
        if (row.xml_autorizado)
          attachments.push({
            filename: `${secuencial}.xml`,
            content: Buffer.from(row.xml_autorizado, 'utf-8'),
          });

        if (to.length === 0 || to.join(',') === 'undefined') {
          this.logger.operation(emisor, 'mail.enviar', 'omitido', {
            ...base,
            motivo: 'sin destinatarios',
          });
        } else {
          await this.sendMail(
            emisor,
            mailCfg,
            {
              from: emisor.mail.auth.user,
              to,
              subject: `📝 ${tipo.toUpperCase()} - ${row.nombre_comprador}, FACTURACIÓN ELECTRÓNICA ${secuencial}`,
              html,
              attachments,
            },
            { ...base, destinatarios: to.length, ms: Date.now() - started },
          );
        }
      } catch (err) {
        // fallos de preparacion (XML, RIDE, config): el legacy respondia 500
        this.logger.operation(emisor, 'mail.enviar', 'error', {
          ...base,
          err: err instanceof Error ? err : new Error(String(err)),
        });
        throw err instanceof HttpException
          ? err
          : new HttpException(
              'No se pudo preparar el correo',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
      }

      // WhatsApp nunca debe impedir el correo ya enviado ni el marcado del comprobante
      try {
        await this.sendWhatsApp(
          emisor,
          row.telefono,
          pdfPath,
          secuencial,
          base,
        );
      } catch (err) {
        this.logger.operation(emisor, 'whatsapp.comprobante', 'error', {
          ...base,
          err: err instanceof Error ? err : new Error(String(err)),
        });
      }
      await conn.query(
        `UPDATE ce_comprobante SET email = 1 WHERE ce_id = ${id}`,
      );
    });
  }

  private comprobanteQuery(id: string): string {
    return `SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador,
    empresa,
    (case when ce_comprobante.tipo_comprobante='FV' OR ce_comprobante.tipo_comprobante='NC' OR ce_comprobante.tipo_comprobante='GR'  then  (SELECT first cl.telefono  FROM in_cliente  cl WHERE cl.cedula_ruc = ruc_comprador AND cl.empresa = ce_comprobante.empresa  ) else (SELECT first pl.telefono  FROM in_proveedor  pl WHERE pl.cedula = ruc_comprador AND pl.empresa = ce_comprobante.empresa  ) end ) as telefono
  FROM ce_comprobante WHERE ce_id = ${id}`;
  }

  /** Marca un comprobante como ya notificado (lo usa la tarea programada). */
  markSent(dbTenant: Tenant, ceId: string | number): Promise<unknown> {
    return this.db.query(
      dbTenant,
      `UPDATE ce_comprobante SET email = 1 WHERE ce_id = ${sqlInt(ceId, 'ce_id')}`,
    );
  }

  /**
   * Un error de entrega NO falla la peticion (igual que el legacy, que respondia 200): se registra
   * como error de la empresa. 501 / "No recipients defined" = destinatario mal ingresado.
   */
  private async sendMail(
    emisor: Tenant,
    mailCfg: Record<string, any>,
    options: Record<string, any>,
    meta: Record<string, unknown>,
  ) {
    try {
      const info = await createTransport(mailCfg as never).sendMail(
        options as never,
      );
      this.logger.operation(emisor, 'mail.enviar', 'ok', {
        ...meta,
        messageId: info?.messageId,
      });
    } catch (error: any) {
      if (
        error?.responseCode == 501 ||
        String(error) === 'Error: No recipients defined'
      ) {
        this.logger.operation(emisor, 'mail.enviar', 'omitido', {
          ...meta,
          motivo: 'Correo receptor mal ingresado',
        });
      } else {
        this.logger.operation(emisor, 'mail.enviar', 'error', {
          ...meta,
          err: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }

  /**
   * Envia el PDF por WhatsApp. Devuelve el resultado (no lanza por fallos del servicio de WhatsApp);
   * el flujo automatico lo ignora y el boton "solo WhatsApp" lo traduce a un error para el usuario.
   */
  private async sendWhatsApp(
    emisor: Tenant,
    telefono: string | null | undefined,
    pdfPath: string,
    secuencial: string,
    base: Record<string, unknown>,
  ): Promise<
    WhatsAppResult | { ok: false; reason: 'phone' | 'config'; message: string }
  > {
    const phoneId = emisor.whatsapp?.phoneNumberId;
    if (!phoneId || !this.settings.for(emisor).whatsappBaseUrl)
      return {
        ok: false,
        reason: 'config',
        message: 'WhatsApp no esta configurado para esta empresa',
      };
    const phone = WhatsAppService.normalizePhone(telefono);
    if (!phone) {
      this.logger.operation(emisor, 'whatsapp.comprobante', 'omitido', {
        ...base,
        motivo: 'cliente sin celular valido',
      });
      return {
        ok: false,
        reason: 'phone',
        message: 'El cliente no tiene un celular valido registrado',
      };
    }
    const pdf = await readFile(pdfPath);
    const res = await this.whatsapp.deliver(emisor, phoneId, {
      phone,
      pdfBase64: pdf.toString('base64'),
      fileName: `${secuencial}.pdf`,
    });
    this.logger.operation(
      emisor,
      'whatsapp.comprobante',
      res.ok ? 'ok' : 'error',
      {
        ...base,
        ...(res.ok ? {} : { motivo: res.message, reason: res.reason }),
      },
    );
    return res;
  }

  /**
   * Envia el comprobante SOLO por WhatsApp (sin correo y sin tocar ce_comprobante.email).
   * `phoneOverride` permite indicar otro celular; si no, se usa el del cliente/proveedor.
   * Errores: 404 comprobante, 422 sin celular valido, 424 WhatsApp no configurado/token/servicio.
   */
  async enviarWhatsApp(
    dbTenant: Tenant,
    ceId: string,
    phoneOverride?: string,
  ): Promise<void> {
    const id = sqlInt(ceId, 'ce_id');
    const rows = await this.db.query<Row>(dbTenant, this.comprobanteQuery(id));
    const row = rows[0];
    if (!row) throw new NotFoundException('Comprobante no encontrado');

    const xml = await parseXml(row.ce_xml);
    const root = Object.keys(xml)[0];
    const tipo = tipoFromXml(xml);
    const it = xml[root].infoTributaria[0];
    const emisor = this.registry.selectByRuc(it.ruc[0]) ?? dbTenant;
    this.tenantContext.bind(emisor);
    const secuencial = `${it.estab[0]}-${it.ptoEmi[0]}-${it.secuencial[0]}`;
    const base = {
      ceId: id,
      tipo,
      comprobante: secuencial,
      baseDatos: dbTenant.db.db,
    };

    let res;
    try {
      if (!tipo) throw new Error(`Tipo de comprobante no soportado: ${root}`);
      const pdfPath = (
        await this.ride.generate(tipo, row.ce_xml, row.fecha_autorizacion)
      ).path;
      res = await this.sendWhatsApp(
        emisor,
        phoneOverride || row.telefono,
        pdfPath,
        secuencial,
        base,
      );
    } catch (err) {
      this.logger.operation(emisor, 'whatsapp.comprobante', 'error', {
        ...base,
        err: err instanceof Error ? err : new Error(String(err)),
      });
      throw new HttpException(
        'No se pudo preparar el envio por WhatsApp',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (res.ok) return;
    // 4xx a proposito: el filtro global oculta el mensaje de los 5xx y aqui el usuario debe verlo
    const status =
      res.reason === 'phone'
        ? HttpStatus.UNPROCESSABLE_ENTITY
        : HttpStatus.FAILED_DEPENDENCY;
    const message =
      res.reason === 'token_expired'
        ? 'El token de WhatsApp esta expirado o es invalido. Contacte al administrador.'
        : res.message;
    throw new HttpException(message, status);
  }

  /** Copia del transporte de la empresa; con OAuth2 agrega el accessToken (sin mutar la config). */
  private async resolveTransport(mail: NonNullable<Tenant['mail']>) {
    const cfg: Record<string, any> = {
      ...mail,
      auth: { ...mail.auth },
    };
    if (cfg.auth.type == 'OAuth2') {
      const client = new OAuth2Client(
        cfg.auth.clientId,
        cfg.auth.clientSecret,
        'https://developers.google.com/oauthplayground',
      );
      client.setCredentials({ refresh_token: cfg.auth.refreshToken });
      const { token } = await client.getAccessToken();
      cfg.auth.accessToken = token;
    }
    return cfg;
  }

  private renderHtml(
    emisor: Tenant,
    row: Row,
    xml: Record<string, any>,
    tipo: string,
  ): string {
    const cfg = this.settings.for(emisor);
    let html = cfg.mailTemplate;
    html = html.replace('%facturonURL%', () => cfg.facturonURL);
    html = html.replace('%cliente%', () => String(row.nombre_comprador ?? ''));
    html = html.replace(
      '%fecha%',
      moment(row.fecha_autorizacion, 'YYYY-MM-DDTHH:mm:ss').format(
        'DD-MM-YYYY',
      ),
    );
    html = html.replace('%valor%', String(getValorFromXml(xml)));
    html = html.replace('%tipo_comprobante%', tipo.toUpperCase());
    return html;
  }
}
