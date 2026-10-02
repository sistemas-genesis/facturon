import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Tenant } from './tenant.types.js';

/** Inyecta la empresa resuelta por TenantGuard: handler(@CurrentTenant() tenant: Tenant) */
export const CurrentTenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Tenant => {
    return ctx.switchToHttp().getRequest().tenant;
  },
);
