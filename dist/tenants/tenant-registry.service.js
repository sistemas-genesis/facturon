var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, readFileSync, watch, } from 'fs';
import { join, resolve } from 'path';
import { APP_CONFIG } from '../config/app-config.js';
import { SYSTEM_SLUG, TenantLoggerService, } from '../logger/tenant-logger.service.js';
import { tenantSchema } from './tenant.types.js';
let TenantRegistry = class TenantRegistry {
    logger;
    tenants = new Map();
    dir;
    watcher;
    timer;
    constructor(config, logger) {
        this.logger = logger;
        this.dir = resolve(config.tenantsDir);
    }
    onModuleInit() {
        mkdirSync(this.dir, { recursive: true });
        this.reload();
        this.watcher = watch(this.dir, () => {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.reload(), 300);
        });
        this.watcher.on('error', (e) => this.logger
            .forTenant(SYSTEM_SLUG)
            .error({ event: 'tenant.watch_failed', err: e }, 'Fallo el watcher de empresas'));
    }
    onModuleDestroy() {
        clearTimeout(this.timer);
        this.watcher?.close();
    }
    list() {
        return [...this.tenants.values()];
    }
    getBySlug(slug) {
        return this.tenants.get(slug);
    }
    findByDb(db) {
        return this.list().filter((t) => t.db.db === db);
    }
    findByRuc(ruc) {
        return this.list().filter((t) => t.ruc === ruc);
    }
    selectByRuc(ruc, estab, ptoEmi) {
        let fallback;
        for (const t of this.list()) {
            if (!t.enabled || t.ruc !== ruc)
                continue;
            fallback = t;
            if (t.estacion === '' || t.estacion === estab)
                if (t.punto === '' || t.punto === ptoEmi)
                    return t;
        }
        return fallback;
    }
    distinctDatabases() {
        const out = [];
        for (const t of this.list()) {
            if (!t.enabled)
                continue;
            if (!out.some((o) => o.db.db === t.db.db && o.db.host === t.db.host))
                out.push(t);
        }
        return out;
    }
    reload() {
        const next = new Map();
        const errors = [];
        const sys = this.logger.forTenant(SYSTEM_SLUG);
        for (const file of existsSync(this.dir) ? readdirSync(this.dir) : []) {
            if (!file.endsWith('.json'))
                continue;
            try {
                let raw;
                try {
                    raw = JSON.parse(readFileSync(join(this.dir, file), 'utf8'));
                }
                catch {
                    throw new Error('JSON invalido');
                }
                const parsed = tenantSchema.safeParse(raw);
                if (!parsed.success) {
                    throw new Error(parsed.error.issues
                        .map((i) => `${i.path.join('.')}: ${i.message}`)
                        .join('; '));
                }
                const t = parsed.data;
                if (file !== `${t.slug}.json`)
                    throw new Error(`el archivo debe llamarse ${t.slug}.json`);
                if (next.has(t.slug))
                    throw new Error(`slug duplicado '${t.slug}'`);
                next.set(t.slug, t);
            }
            catch (e) {
                const msg = `${file}: ${e.message}`;
                errors.push(msg);
                sys.error({ event: 'tenant.load_failed', file }, `Config de empresa invalida, se conserva la version anterior si existia -> ${msg}`);
                const slug = file.replace(/\.json$/, '');
                const prev = this.tenants.get(slug);
                if (prev && !next.has(slug))
                    next.set(slug, prev);
            }
        }
        for (const slug of next.keys())
            if (!this.tenants.has(slug))
                sys.info({ event: 'tenant.added', slug }, `Empresa agregada: ${slug}`);
        for (const slug of this.tenants.keys())
            if (!next.has(slug))
                sys.warn({ event: 'tenant.removed', slug }, `Empresa retirada: ${slug}`);
        for (const t of next.values())
            if (t.logLevel)
                this.logger.setLevel(t.slug, t.logLevel);
        this.tenants = next;
        sys.info({ event: 'tenant.reloaded', count: next.size }, `Empresas cargadas: ${next.size}`);
        return { loaded: next.size, errors };
    }
};
TenantRegistry = __decorate([
    Injectable(),
    __param(0, Inject(APP_CONFIG)),
    __metadata("design:paramtypes", [Object, TenantLoggerService])
], TenantRegistry);
export { TenantRegistry };
//# sourceMappingURL=tenant-registry.service.js.map