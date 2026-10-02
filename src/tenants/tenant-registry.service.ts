import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  existsSync,
  FSWatcher,
  mkdirSync,
  readdirSync,
  readFileSync,
  watch,
} from 'fs';
import { join, resolve } from 'path';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import {
  SYSTEM_SLUG,
  TenantLoggerService,
} from '../logger/tenant-logger.service.js';
import { Tenant, tenantSchema } from './tenant.types.js';

/**
 * Registro unico de empresas: un JSON por empresa en TENANTS_DIR.
 * Se recarga solo al cambiar la carpeta, asi se suma una empresa sin reiniciar el proceso.
 * Un archivo invalido NO tumba a las demas empresas ni reemplaza la version valida anterior.
 */
@Injectable()
export class TenantRegistry implements OnModuleInit, OnModuleDestroy {
  private tenants = new Map<string, Tenant>();
  private readonly dir: string;
  private watcher?: FSWatcher;
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly logger: TenantLoggerService,
  ) {
    this.dir = resolve(config.tenantsDir);
  }

  onModuleInit() {
    mkdirSync(this.dir, { recursive: true });
    this.reload();
    this.watcher = watch(this.dir, () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.reload(), 300); // debounce: los editores escriben varias veces
    });
    // sin handler, un error del watcher (p. ej. carpeta borrada) tumbaria todo el proceso
    this.watcher.on('error', (e) =>
      this.logger
        .forTenant(SYSTEM_SLUG)
        .error(
          { event: 'tenant.watch_failed', err: e },
          'Fallo el watcher de empresas',
        ),
    );
  }

  onModuleDestroy() {
    clearTimeout(this.timer);
    this.watcher?.close();
  }

  list(): Tenant[] {
    return [...this.tenants.values()];
  }

  getBySlug(slug: string): Tenant | undefined {
    return this.tenants.get(slug);
  }

  /** Puede haber mas de una empresa con el mismo nombre de BD en hosts distintos: el llamador decide. */
  findByDb(db: string): Tenant[] {
    return this.list().filter((t) => t.db.db === db);
  }

  findByRuc(ruc: string): Tenant[] {
    return this.list().filter((t) => t.ruc === ruc);
  }

  /**
   * Misma regla que utilities.getDatabaseInfoByRuc del legacy: entre las empresas con ese RUC elige
   * la que coincide en establecimiento y punto de emision (vacio = comodin); si ninguna coincide
   * exactamente, la ultima con ese RUC. Solo considera empresas habilitadas.
   */
  selectByRuc(
    ruc: string,
    estab?: string,
    ptoEmi?: string,
  ): Tenant | undefined {
    let fallback: Tenant | undefined;
    for (const t of this.list()) {
      if (!t.enabled || t.ruc !== ruc) continue;
      fallback = t;
      if (t.estacion === '' || t.estacion === estab)
        if (t.punto === '' || t.punto === ptoEmi) return t;
    }
    return fallback;
  }

  /** Empresas habilitadas sin repetir la misma BD en el mismo host (getDatabasesDistinct del legacy). */
  distinctDatabases(): Tenant[] {
    const out: Tenant[] = [];
    for (const t of this.list()) {
      if (!t.enabled) continue;
      if (!out.some((o) => o.db.db === t.db.db && o.db.host === t.db.host))
        out.push(t);
    }
    return out;
  }

  reload(): { loaded: number; errors: string[] } {
    const next = new Map<string, Tenant>();
    const errors: string[] = [];
    const sys = this.logger.forTenant(SYSTEM_SLUG);

    for (const file of existsSync(this.dir) ? readdirSync(this.dir) : []) {
      if (!file.endsWith('.json')) continue;
      try {
        let raw: unknown;
        try {
          raw = JSON.parse(readFileSync(join(this.dir, file), 'utf8'));
        } catch {
          // el mensaje nativo de JSON.parse puede citar un trozo del archivo (y ahi hay credenciales)
          throw new Error('JSON invalido');
        }
        const parsed = tenantSchema.safeParse(raw);
        if (!parsed.success) {
          throw new Error(
            parsed.error.issues
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; '),
          );
        }
        const t = parsed.data;
        if (file !== `${t.slug}.json`)
          throw new Error(`el archivo debe llamarse ${t.slug}.json`);
        if (next.has(t.slug)) throw new Error(`slug duplicado '${t.slug}'`);
        next.set(t.slug, t);
      } catch (e) {
        const msg = `${file}: ${(e as Error).message}`;
        errors.push(msg);
        sys.error(
          { event: 'tenant.load_failed', file },
          `Config de empresa invalida, se conserva la version anterior si existia -> ${msg}`,
        );
        // conservar la version valida anterior de esa empresa
        const slug = file.replace(/\.json$/, '');
        const prev = this.tenants.get(slug);
        if (prev && !next.has(slug)) next.set(slug, prev);
      }
    }

    for (const slug of next.keys())
      if (!this.tenants.has(slug))
        sys.info({ event: 'tenant.added', slug }, `Empresa agregada: ${slug}`);
    for (const slug of this.tenants.keys())
      if (!next.has(slug))
        sys.warn(
          { event: 'tenant.removed', slug },
          `Empresa retirada: ${slug}`,
        );
    for (const t of next.values())
      if (t.logLevel) this.logger.setLevel(t.slug, t.logLevel);

    this.tenants = next;
    sys.info(
      { event: 'tenant.reloaded', count: next.size },
      `Empresas cargadas: ${next.size}`,
    );
    return { loaded: next.size, errors };
  }
}
