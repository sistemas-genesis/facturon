var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpException, HttpStatus, Injectable, NotFoundException, } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import moment from 'moment';
import { createTransport } from 'nodemailer';
import { getValorFromXml, parseXml, tipoFromXml } from '../common/sri-xml.js';
import { sqlInt } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import { RideService } from '../ride/ride.service.js';
import { WhatsAppService } from './whatsapp.service.js';
let MailService = class MailService {
    settings;
    db;
    registry;
    tenantContext;
    ride;
    whatsapp;
    logger;
    constructor(settings, db, registry, tenantContext, ride, whatsapp, logger) {
        this.settings = settings;
        this.db = db;
        this.registry = registry;
        this.tenantContext = tenantContext;
        this.ride = ride;
        this.whatsapp = whatsapp;
        this.logger = logger;
    }
    async enviar(dbTenant, ceId, mails, ctx = {}) {
        const id = sqlInt(ceId, 'ce_id');
        const corr = ctx.correlationId ? { correlationId: ctx.correlationId } : {};
        const query = `SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador,
    empresa,
    (case when ce_comprobante.tipo_comprobante='FV' OR ce_comprobante.tipo_comprobante='NC' OR ce_comprobante.tipo_comprobante='GR'  then  (SELECT first cl.telefono  FROM in_cliente  cl WHERE cl.cedula_ruc = ruc_comprador AND cl.empresa = ce_comprobante.empresa  ) else (SELECT first LEFT(pl.telefono,9)  FROM in_proveedor  pl WHERE pl.cedula = ruc_comprador AND pl.empresa = ce_comprobante.empresa  ) end ) as telefono
  FROM ce_comprobante WHERE ce_id = ${id}`;
        await this.db.withConnection(dbTenant, async (conn) => {
            const rows = await conn.query(query);
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
            let pdfPath;
            try {
                if (!tipo)
                    throw new Error(`Tipo de comprobante no soportado: ${root}`);
                if (!emisor.mail)
                    throw new Error('La empresa no tiene configurado el bloque "mail"');
                pdfPath = (await this.ride.generate(tipo, row.ce_xml, row.fecha_autorizacion)).path;
                const mailCfg = await this.resolveTransport(emisor.mail);
                const to = mails
                    .split(',')
                    .map((m) => m.trim())
                    .filter(Boolean);
                const html = this.renderHtml(emisor, row, xml, tipo);
                const attachments = [
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
                }
                else {
                    await this.sendMail(emisor, mailCfg, {
                        from: emisor.mail.auth.user,
                        to,
                        subject: `📝 ${tipo.toUpperCase()} - ${row.nombre_comprador}, FACTURACIÓN ELECTRÓNICA ${secuencial}`,
                        html,
                        attachments,
                    }, { ...base, destinatarios: to.length, ms: Date.now() - started });
                }
            }
            catch (err) {
                this.logger.operation(emisor, 'mail.enviar', 'error', {
                    ...base,
                    err: err instanceof Error ? err : new Error(String(err)),
                });
                throw err instanceof HttpException
                    ? err
                    : new HttpException('No se pudo preparar el correo', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            await this.sendWhatsApp(emisor, row.telefono, pdfPath, base);
            await conn.query(`UPDATE ce_comprobante SET email = 1 WHERE ce_id = ${id}`);
        });
    }
    markSent(dbTenant, ceId) {
        return this.db.query(dbTenant, `UPDATE ce_comprobante SET email = 1 WHERE ce_id = ${sqlInt(ceId, 'ce_id')}`);
    }
    async sendMail(emisor, mailCfg, options, meta) {
        try {
            const info = await createTransport(mailCfg).sendMail(options);
            this.logger.operation(emisor, 'mail.enviar', 'ok', {
                ...meta,
                messageId: info?.messageId,
            });
        }
        catch (error) {
            if (error?.responseCode == 501 ||
                String(error) === 'Error: No recipients defined') {
                this.logger.operation(emisor, 'mail.enviar', 'omitido', {
                    ...meta,
                    motivo: 'Correo receptor mal ingresado',
                });
            }
            else {
                this.logger.operation(emisor, 'mail.enviar', 'error', {
                    ...meta,
                    err: error instanceof Error ? error : new Error(String(error)),
                });
            }
        }
    }
    async sendWhatsApp(emisor, telefono, pdfPath, base) {
        const phoneId = emisor.whatsapp?.phoneNumberId;
        if (!phoneId)
            return;
        const token = await this.whatsapp.generateToken(emisor, phoneId);
        if (!telefono || !token)
            return;
        const pdf = await readFile(pdfPath);
        const phone = telefono.startsWith('593')
            ? telefono
            : '593' + telefono.slice(1);
        await this.whatsapp.send(emisor, token, {
            phone,
            pdfBase64: pdf.toString('base64'),
        });
        this.logger.operation(emisor, 'whatsapp.comprobante', 'ok', base);
    }
    async resolveTransport(mail) {
        const cfg = {
            ...mail,
            auth: { ...mail.auth },
        };
        if (cfg.auth.type == 'OAuth2') {
            const client = new OAuth2Client(cfg.auth.clientId, cfg.auth.clientSecret, 'https://developers.google.com/oauthplayground');
            client.setCredentials({ refresh_token: cfg.auth.refreshToken });
            const { token } = await client.getAccessToken();
            cfg.auth.accessToken = token;
        }
        return cfg;
    }
    renderHtml(emisor, row, xml, tipo) {
        const cfg = this.settings.for(emisor);
        let html = cfg.mailTemplate;
        html = html.replace('%facturonURL%', () => cfg.facturonURL);
        html = html.replace('%cliente%', () => String(row.nombre_comprador ?? ''));
        html = html.replace('%fecha%', moment(row.fecha_autorizacion, 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY'));
        html = html.replace('%valor%', String(getValorFromXml(xml)));
        html = html.replace('%tipo_comprobante%', tipo.toUpperCase());
        return html;
    }
};
MailService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        SybaseService,
        TenantRegistry,
        TenantContext,
        RideService,
        WhatsAppService,
        TenantLoggerService])
], MailService);
export { MailService };
//# sourceMappingURL=mail.service.js.map