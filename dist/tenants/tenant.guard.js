var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, } from '@nestjs/common';
import { TenantContext } from './tenant-context.service.js';
import { TenantRegistry } from './tenant-registry.service.js';
let TenantGuard = class TenantGuard {
    registry;
    context;
    constructor(registry, context) {
        this.registry = registry;
        this.context = context;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const db = req.params?.db;
        const found = db ? this.registry.findByDb(String(db)) : [];
        const tenant = this.elegir(found, req.body?.empresas);
        if (!tenant || !tenant.enabled)
            throw new NotFoundException('Empresa no encontrada');
        req.tenant = tenant;
        this.context.bind(tenant);
        return true;
    }
    elegir(found, empresas) {
        if (found.length <= 1)
            return found[0];
        const conexion = (t) => `${t.db.host}:${t.db.port}/${t.db.db}/${t.db.user}`;
        if (new Set(found.map(conexion)).size > 1)
            return undefined;
        const rucs = typeof empresas === 'string' ? empresas : '';
        return found.find((t) => rucs.includes(t.ruc)) ?? found[0];
    }
};
TenantGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantRegistry,
        TenantContext])
], TenantGuard);
export { TenantGuard };
//# sourceMappingURL=tenant.guard.js.map