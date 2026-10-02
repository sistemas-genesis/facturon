import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Tenant } from './tenant.types.js';

/**
 * Deja la empresa en el contexto del request (CLS) para que logger, interceptor y filtro de
 * errores atribuyan el request a ella. Lo usan TenantGuard (rutas con :db) y los servicios que
 * descubren la empresa por el RUC del XML (rutas /api/documento/ride/*).
 */
@Injectable()
export class TenantContext {
  constructor(private readonly cls: ClsService) {}

  bind(tenant: Tenant): void {
    if (!this.cls.isActive()) return;
    this.cls.set('tenantSlug', tenant.slug);
    this.cls.set('tenantLogLevel', tenant.logLevel);
    this.cls.set('tenantRuc', tenant.ruc);
    this.cls.set('tenantName', tenant.nombreComercial);
  }
}
