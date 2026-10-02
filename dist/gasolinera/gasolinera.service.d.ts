import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export declare class GasolineraService {
    private readonly settings;
    private readonly db;
    private readonly logger;
    constructor(settings: TenantSettings, db: SybaseService, logger: TenantLoggerService);
    persona(tenant: Tenant, cedula: string): Promise<void>;
}
