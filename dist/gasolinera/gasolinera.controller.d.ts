import type { Tenant } from '../tenants/tenant.types.js';
import { GasolineraService } from './gasolinera.service.js';
export declare class GasolineraController {
    private readonly gasolinera;
    constructor(gasolinera: GasolineraService);
    persona(tenant: Tenant, cedula: string): Promise<void>;
}
