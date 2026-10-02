import { Global, Module } from '@nestjs/common';
import { TenantContext } from './tenant-context.service.js';
import { TenantRegistry } from './tenant-registry.service.js';
import { TenantSettings } from './tenant-settings.service.js';
import { TenantGuard } from './tenant.guard.js';

@Global()
@Module({
  providers: [TenantRegistry, TenantContext, TenantSettings, TenantGuard],
  exports: [TenantRegistry, TenantContext, TenantSettings, TenantGuard],
})
export class TenantsModule {}
