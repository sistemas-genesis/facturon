var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { TenantContext } from './tenant-context.service.js';
import { TenantRegistry } from './tenant-registry.service.js';
import { TenantSettings } from './tenant-settings.service.js';
import { TenantGuard } from './tenant.guard.js';
let TenantsModule = class TenantsModule {
};
TenantsModule = __decorate([
    Global(),
    Module({
        providers: [TenantRegistry, TenantContext, TenantSettings, TenantGuard],
        exports: [TenantRegistry, TenantContext, TenantSettings, TenantGuard],
    })
], TenantsModule);
export { TenantsModule };
//# sourceMappingURL=tenants.module.js.map