import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { RideService } from '../ride/ride.service.js';
import { WhatsAppService } from './whatsapp.service.js';
export interface EnvioContext {
    correlationId?: string;
}
export declare class MailService {
    private readonly settings;
    private readonly db;
    private readonly registry;
    private readonly tenantContext;
    private readonly ride;
    private readonly whatsapp;
    private readonly logger;
    constructor(settings: TenantSettings, db: SybaseService, registry: TenantRegistry, tenantContext: TenantContext, ride: RideService, whatsapp: WhatsAppService, logger: TenantLoggerService);
    enviar(dbTenant: Tenant, ceId: string, mails: string, ctx?: EnvioContext): Promise<void>;
    markSent(dbTenant: Tenant, ceId: string | number): Promise<unknown>;
    private sendMail;
    private sendWhatsApp;
    private resolveTransport;
    private renderHtml;
}
