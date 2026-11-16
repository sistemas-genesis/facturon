import { TenantRegistry } from '../tenants/tenant-registry.service.js';
export declare class HealthController {
    private readonly registry;
    constructor(registry: TenantRegistry);
    check(): {
        status: string;
        uptimeSec: number;
        tenants: {
            total: number;
            enabled: number;
        };
    };
}
