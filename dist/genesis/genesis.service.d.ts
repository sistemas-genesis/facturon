import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { RideService } from '../ride/ride.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export declare class GenesisService {
    private readonly db;
    private readonly ride;
    private readonly logger;
    constructor(db: SybaseService, ride: RideService, logger: TenantLoggerService);
    private generar;
    ride_(tenant: Tenant, claveAcceso: string): Promise<void>;
    rideBlob(tenant: Tenant, claveAcceso: string): Promise<string>;
}
