import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export declare class SriClient {
    private readonly settings;
    constructor(settings: TenantSettings);
    autorizacionComprobante(tenant: Tenant, claveAcceso: string): Promise<string>;
    comprobante(tenant: Tenant, claveAcceso: string): Promise<Record<string, any>>;
}
