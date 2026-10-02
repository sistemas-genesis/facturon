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
import { ClsService } from 'nestjs-cls';
import { join, resolve } from 'path';
import pino from 'pino';
import { APP_CONFIG } from '../config/app-config.js';
import { DailyFileStream } from './daily-file.stream.js';
export const SYSTEM_SLUG = '_system';
const SLUG_RE = /^[a-z0-9_-]{2,63}$/;
const REDACT = [
    'pass',
    'password',
    'token',
    'apiKey',
    'clientSecret',
    'refreshToken',
    'authorization',
    '*.pass',
    '*.password',
    '*.token',
    '*.apiKey',
    '*.clientSecret',
    '*.refreshToken',
    '*.authorization',
    '*.*.pass',
    '*.*.password',
    '*.*.token',
    '*.*.apiKey',
    '*.*.clientSecret',
    '*.*.refreshToken',
    '*.*.authorization',
    '*.*.*.pass',
    '*.*.*.clientSecret',
    '*.*.*.refreshToken',
    'xml',
    'ce_xml',
    'xml_autorizado',
    'firma',
    'key',
    'req.headers.authorization',
    'req.headers["x-api-key"]',
    'req.headers["x-admin-key"]',
];
let TenantLoggerService = class TenantLoggerService {
    cls;
    entries = new Map();
    logsDir;
    defaultLevel;
    retentionDays;
    constructor(config, cls) {
        this.cls = cls;
        this.logsDir = resolve(config.logsDir);
        this.defaultLevel = config.logLevel;
        this.retentionDays = config.logRetentionDays;
    }
    forTenant(slug, level) {
        return this.entry(slug, level).logger;
    }
    current() {
        const slug = this.cls.isActive()
            ? this.cls.get('tenantSlug')
            : undefined;
        const level = this.cls.isActive()
            ? this.cls.get('tenantLogLevel')
            : undefined;
        return this.forTenant(slug ?? SYSTEM_SLUG, level);
    }
    setLevel(slug, level) {
        this.entry(slug).logger.level = level;
    }
    operation(tenant, accion, resultado, meta = {}) {
        const log = this.forTenant(tenant.slug, tenant.logLevel);
        const requestId = this.cls.isActive() ? this.cls.getId() : undefined;
        const payload = {
            event: 'empresa.operacion',
            empresaRuc: tenant.ruc,
            empresaNombre: tenant.nombreComercial,
            accion,
            resultado,
            requestId,
            ...meta,
        };
        const msg = `[${tenant.nombreComercial} | RUC ${tenant.ruc}] ${accion} -> ${resultado}`;
        if (resultado === 'error')
            log.error(payload, msg);
        else
            log.info(payload, msg);
    }
    async audited(tenant, accion, fn, okMeta, meta = {}) {
        const started = Date.now();
        try {
            const result = await fn();
            this.operation(tenant, accion, 'ok', {
                ...meta,
                ...(okMeta ? okMeta(result) : {}),
                ms: Date.now() - started,
            });
            return result;
        }
        catch (err) {
            this.operation(tenant, accion, 'error', {
                ...meta,
                ms: Date.now() - started,
                err: err instanceof Error ? err : new Error(String(err)),
            });
            throw err;
        }
    }
    info(msg, meta) {
        this.current().info(this.asMeta(meta), msg);
    }
    warn(msg, ...rest) {
        this.nest('warn', msg, rest);
    }
    debug(msg, ...rest) {
        this.nest('debug', msg, rest);
    }
    errorWith(msg, err, meta = {}) {
        this.current().error({ ...meta, err: err instanceof Error ? err : new Error(String(err)) }, msg);
    }
    log(message, ...rest) {
        this.nest('info', message, rest);
    }
    error(message, ...rest) {
        this.nest('error', message, rest);
    }
    verbose(message, ...rest) {
        this.nest('trace', message, rest);
    }
    fatal(message, ...rest) {
        this.nest('error', message, rest);
    }
    onModuleDestroy() {
        for (const e of this.entries.values())
            e.streams.forEach((s) => s.end());
        this.entries.clear();
    }
    entry(slug, level) {
        if (slug !== SYSTEM_SLUG && !SLUG_RE.test(slug))
            slug = SYSTEM_SLUG;
        let e = this.entries.get(slug);
        if (!e) {
            const dir = join(this.logsDir, slug);
            const app = new DailyFileStream(dir, 'app', this.retentionDays);
            const err = new DailyFileStream(dir, 'error', this.retentionDays);
            const logger = pino({
                level: level ?? this.defaultLevel,
                base: { tenant: slug },
                redact: { paths: REDACT, censor: '[REDACTED]' },
                serializers: { err: pino.stdSerializers.err },
                timestamp: pino.stdTimeFunctions.isoTime,
            }, pino.multistream([
                { level: 'trace', stream: app },
                { level: 'error', stream: err },
                { level: 'info', stream: process.stdout },
            ]));
            e = { logger, streams: [app, err] };
            this.entries.set(slug, e);
        }
        return e;
    }
    asMeta(meta) {
        return typeof meta === 'string' ? { context: meta } : (meta ?? {});
    }
    nest(level, message, rest) {
        const last = rest[rest.length - 1];
        if (last && typeof last === 'object' && !(last instanceof Error)) {
            const text = typeof message === 'string' ? message : JSON.stringify(message);
            this.current()[level](last, text);
            return;
        }
        const context = typeof last === 'string' ? last : undefined;
        const stack = level === 'error' && typeof rest[0] === 'string' && rest.length > 1
            ? rest[0]
            : undefined;
        const log = this.current();
        const payload = { context };
        if (stack)
            payload.stack = stack;
        if (message instanceof Error) {
            log[level]({ ...payload, err: message }, message.message);
        }
        else {
            log[level](payload, typeof message === 'string' ? message : JSON.stringify(message));
        }
    }
};
TenantLoggerService = __decorate([
    Injectable(),
    __param(0, Inject(APP_CONFIG)),
    __metadata("design:paramtypes", [Object, ClsService])
], TenantLoggerService);
export { TenantLoggerService };
//# sourceMappingURL=tenant-logger.service.js.map