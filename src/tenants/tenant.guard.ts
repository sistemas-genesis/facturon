import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantContext } from './tenant-context.service.js';
import { TenantRegistry } from './tenant-registry.service.js';

/**
 * Selector unico de empresa, igual que el servicio original: el parametro `:db` de la ruta
 * (/api/.../:db/...) identifica a la empresa (su JSON en config/tenants). La empresa queda en el
 * contexto (CLS) para que el logger y los servicios trabajen sobre ella.
 * Sin empresa, deshabilitada o ambigua (mismo nombre de BD en dos empresas) -> 404.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly registry: TenantRegistry,
    private readonly context: TenantContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const db = req.params?.db;
    const found = db ? this.registry.findByDb(String(db)) : [];
    const tenant = found.length === 1 ? found[0] : undefined; // ambiguo => no se adivina
    if (!tenant || !tenant.enabled)
      throw new NotFoundException('Empresa no encontrada');

    req.tenant = tenant;
    this.context.bind(tenant);
    return true;
  }
}
