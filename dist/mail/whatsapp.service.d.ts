import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export declare class WhatsAppService {
    private readonly settings;
    private readonly logger;
    constructor(settings: TenantSettings, logger: TenantLoggerService);
    generateToken(tenant: Tenant, phoneNumberId: string): Promise<string | null>;
    requestToken(tenant: Tenant, phoneNumberId: string): Promise<TokenResult>;
    static normalizePhone(raw: string | null | undefined): string | null;
    deliver(tenant: Tenant, phoneNumberId: string, options: {
        phone: string;
        pdfBase64: string;
        text?: string;
        fileName?: string;
    }): Promise<WhatsAppResult>;
    send(tenant: Tenant, token: string, options: {
        phone: string;
        pdfBase64: string;
        text?: string;
        fileName?: string;
    }): Promise<boolean>;
    private post;
}
export type WhatsAppResult = {
    ok: true;
} | {
    ok: false;
    reason: 'disabled' | 'token' | 'token_expired' | 'http' | 'network' | 'phone_id_invalid' | 'phone_not_found' | 'unavailable';
    message: string;
    status?: number;
};
type TokenResult = {
    ok: true;
    token: string;
} | Extract<WhatsAppResult, {
    ok: false;
}>;
export {};
