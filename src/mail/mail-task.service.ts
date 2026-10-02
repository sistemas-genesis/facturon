import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { randomUUID } from 'crypto';
import { type MailTaskConfig } from '../config/app-json.js';
import { getMailFromXml, parseXml } from '../common/sri-xml.js';
import { Row, SybaseService } from '../database/sybase.service.js';
import {
  SYSTEM_SLUG,
  TenantLoggerService,
} from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { MailService } from './mail.service.js';

const JOB_PREFIX = 'mail-task:';

/**
 * Envio automatico de comprobantes autorizados y aun no enviados (utilities.task del legacy).
 * Un cron por BD distinta (host+bd); `mailTask` de la empresa reemplaza al de `defaults` en app.config.json.
 * Se arma al iniciar el proceso: cambiar un mailTask requiere reiniciar.
 */
@Injectable()
export class MailTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly running = new Set<string>();

  constructor(
    private readonly settings: TenantSettings,
    private readonly registry: TenantRegistry,
    private readonly scheduler: SchedulerRegistry,
    private readonly db: SybaseService,
    private readonly mail: MailService,
    private readonly logger: TenantLoggerService,
  ) {}

  onModuleInit() {
    const sys = this.logger.forTenant(SYSTEM_SLUG);
    for (const tenant of this.registry.distinctDatabases()) {
      const cfg = this.settings.for(tenant).mailTask;
      if (!cfg.status) continue;
      try {
        const job = new CronJob(cfg.frequency, () => {
          void this.tick(tenant.slug, cfg);
        });
        this.scheduler.addCronJob(`${JOB_PREFIX}${tenant.slug}`, job);
        job.start();
        sys.info(
          {
            event: 'mailtask.scheduled',
            slug: tenant.slug,
            frequency: cfg.frequency,
          },
          `Tarea de correo programada para ${tenant.nombreComercial}`,
        );
      } catch (err) {
        sys.error(
          { event: 'mailtask.invalid', slug: tenant.slug, err },
          `Frecuencia de mailTask invalida para ${tenant.slug}`,
        );
      }
    }
  }

  onModuleDestroy() {
    for (const name of this.scheduler.getCronJobs().keys())
      if (name.startsWith(JOB_PREFIX)) this.scheduler.deleteCronJob(name);
  }

  /** Una pasada para una empresa (publico para pruebas). Ignora la pasada si la anterior sigue en curso. */
  async tick(slug: string, cfg: MailTaskConfig): Promise<void> {
    const tenant = this.registry.getBySlug(slug);
    if (!tenant || !tenant.enabled || this.running.has(slug)) return;
    this.running.add(slug);
    const correlationId = randomUUID();
    try {
      const query = `SELECT TOP ${cfg.top} ce_id, ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador, ruc_emisor  FROM ce_comprobante WHERE estado = 4 AND email = 0 and fecha_autorizacion > today()-${cfg.lastComprobantesDays}`;
      const rows = await this.logger.audited(
        tenant,
        'mailtask.consulta',
        () => this.db.query<Row>(tenant, query),
        (r) => ({ pendientes: r.length }),
        { correlationId },
      );
      for (const row of rows) await this.procesar(tenant, row, correlationId);
    } catch {
      /* ya registrado por audited() */
    } finally {
      this.running.delete(slug);
    }
  }

  private async procesar(tenant: Tenant, row: Row, correlationId: string) {
    const meta = { ceId: row.ce_id, correlationId };
    let result: Record<string, any>;
    try {
      result = await parseXml(row.ce_xml);
    } catch (err) {
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
      // sin correo en el comprobante: se marca como enviado para no reintentarlo
      await this.mail.markSent(tenant, row.ce_id);
      this.logger.operation(tenant, 'mailtask.comprobante', 'omitido', {
        ...meta,
        motivo: 'comprobante sin correo del cliente',
      });
      return;
    }
    const copia = this.registry.selectByRuc(String(row.ruc_emisor))
      ?.mailsDefault?.mail;
    if (copia) to = `${to},${copia}`;
    try {
      await this.mail.enviar(tenant, String(row.ce_id), to, { correlationId });
    } catch {
      // igual que el legacy: ante un fallo se marca enviado para no bloquear la cola
      await this.mail.markSent(tenant, row.ce_id);
    }
  }
}
