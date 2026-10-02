import { ClsService } from 'nestjs-cls';
import { Tenant } from './tenant.types.js';
export declare class TenantContext {
    private readonly cls;
    constructor(cls: ClsService);
    bind(tenant: Tenant): void;
}
