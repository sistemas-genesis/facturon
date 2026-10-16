import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tenant } from './tenant.types.js';
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
    const tenant = this.elegir(found, req.body?.empresas);
    if (!tenant || !tenant.enabled)
      throw new NotFoundException('Empresa no encontrada');

    req.tenant = tenant;
    this.context.bind(tenant);
    return true;
  }

  /**
   * Varias empresas pueden compartir la misma BD fisica (mismo host/puerto/usuario): la consulta ya
   * filtra por RUC, asi que sirve cualquiera; se prefiere la cuyo RUC viene en `empresas`.
   * Si apuntan a servidores distintos sigue siendo ambiguo y no se adivina.
   */
  private elegir(found: Tenant[], empresas: unknown): Tenant | undefined {
    if (found.length <= 1) return found[0];
    const conexion = (t: Tenant) =>
      `${t.db.host}:${t.db.port}/${t.db.db}/${t.db.user}`;
    if (new Set(found.map(conexion)).size > 1) return undefined;
    const rucs = typeof empresas === 'string' ? empresas : '';
    return found.find((t) => rucs.includes(t.ruc)) ?? found[0];
  }
}
