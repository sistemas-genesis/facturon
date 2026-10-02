import type { Tenant } from '../tenants/tenant.types.js';
import { GenesisService } from './genesis.service.js';
export declare class GenesisController {
    private readonly genesis;
    constructor(genesis: GenesisService);
    ride(tenant: Tenant, clave: string): Promise<void>;
    rideBlob(tenant: Tenant, clave: string): Promise<string>;
}
