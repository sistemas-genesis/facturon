var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { randomUUID } from 'crypto';
import { getMailFromXml, parseXml } from '../common/sri-xml.js';
import { SybaseService } from '../database/sybase.service.js';
import { SYSTEM_SLUG, TenantLoggerService, } from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import { MailService } from './mail.service.js';
const JOB_PREFIX = 'mail-task:';
let MailTaskService = class MailTaskService {
    settings;
    registry;
    scheduler;
    db;
    mail;
    logger;
    running = new Set();
    constructor(settings, registry, scheduler, db, mail, logger) {
        this.settings = settings;
        this.registry = registry;
        this.scheduler = scheduler;
        this.db = db;
        this.mail = mail;
        this.logger = logger;
    }
    onModuleInit() {
        const sys = this.logger.forTenant(SYSTEM_SLUG);
        for (const tenant of this.registry.distinctDatabases()) {
            const cfg = this.settings.for(tenant).mailTask;
            if (!cfg.status)
                continue;
            try {
                const job = new CronJob(cfg.frequency, () => {
                    void this.tick(tenant.slug, cfg);
                });
                this.scheduler.addCronJob(`${JOB_PREFIX}${tenant.slug}`, job);
                job.start();
                sys.info({
                    event: 'mailtask.scheduled',
                    slug: tenant.slug,
                    frequency: cfg.frequency,
                }, `Tarea de correo programada para ${tenant.nombreComercial}`);
            }
            catch (err) {
                sys.error({ event: 'mailtask.invalid', slug: tenant.slug, err }, `Frecuencia de mailTask invalida para ${tenant.slug}`);
            }
        }
    }
    onModuleDestroy() {
        for (const name of this.scheduler.getCronJobs().keys())
            if (name.startsWith(JOB_PREFIX))
                this.scheduler.deleteCronJob(name);
    }
    async tick(slug, cfg) {
        const tenant = this.registry.getBySlug(slug);
        if (!tenant || !tenant.enabled || this.running.has(slug))
            return;
        this.running.add(slug);
        const correlationId = randomUUID();
        try {
            const query = `SELECT TOP ${cfg.top} ce_id, ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador, ruc_emisor  FROM ce_comprobante WHERE estado = 4 AND email = 0 and fecha_autorizacion > today()-${cfg.lastComprobantesDays}`;
            const rows = await this.logger.audited(tenant, 'mailtask.consulta', () => this.db.query(tenant, query), (r) => ({ pendientes: r.length }), { correlationId });
            for (const row of rows)
                await this.procesar(tenant, row, correlationId);
        }
        catch {
        }
        finally {
            this.running.delete(slug);
        }
    }
    async procesar(tenant, row, correlationId) {
        const meta = { ceId: row.ce_id, correlationId };
        let result;
        try {
            result = await parseXml(row.ce_xml);
        }
        catch (err) {
            this.logger.operation(tenant, 'mailtask.comprobante', 'error', {
                ...meta,
                motivo: 'XML ilegible',
                err: err instanceof Error ? err : new Error(String(err)),
            });
            return;
        }
        const root = Object.keys(result)[0];
        const doc = result?.infoTributaria
            ? result
            : result?.factura ||
                result?.comprobanteRetencion ||
                result?.notaCredito ||
                result?.notaDebito ||
                result?.guiaRemision ||
                result?.liquidacionCompra;
        if (!doc?.infoTributaria) {
            this.logger.operation(tenant, 'mailtask.comprobante', 'error', {
                ...meta,
                motivo: 'XML no esta correcto (sin infoTributaria)',
            });
            return;
        }
        let to = getMailFromXml(result[root]);
        if (!to) {
            await this.mail.markSent(tenant, row.ce_id);
            this.logger.operation(tenant, 'mailtask.comprobante', 'omitido', {
                ...meta,
                motivo: 'comprobante sin correo del cliente',
            });
            return;
        }
        const copia = this.registry.selectByRuc(String(row.ruc_emisor))
            ?.mailsDefault?.mail;
        if (copia)
            to = `${to},${copia}`;
        try {
            await this.mail.enviar(tenant, String(row.ce_id), to, { correlationId });
        }
        catch {
            await this.mail.markSent(tenant, row.ce_id);
        }
    }
};
MailTaskService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        TenantRegistry,
        SchedulerRegistry,
        SybaseService,
        MailService,
        TenantLoggerService])
], MailTaskService);
export { MailTaskService };
//# sourceMappingURL=mail-task.service.js.map