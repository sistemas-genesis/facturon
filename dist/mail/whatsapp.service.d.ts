import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export declare class WhatsAppService {
    private readonly settings;
    private readonly logger;
    constructor(settings: TenantSettings, logger: TenantLoggerService);
    generateToken(tenant: Tenant, phoneNumberId: string): Promise<string | null>;
    send(tenant: Tenant, token: string, options: {
        phone: string;
        pdfBase64: string;
        text?: string;
    }): Promise<boolean>;
}
