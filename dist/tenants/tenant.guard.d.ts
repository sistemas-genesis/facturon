import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant-context.service.js';
import { TenantRegistry } from './tenant-registry.service.js';
export declare class TenantGuard implements CanActivate {
    private readonly registry;
    private readonly context;
    constructor(registry: TenantRegistry, context: TenantContext);
    canActivate(context: ExecutionContext): boolean;
}
