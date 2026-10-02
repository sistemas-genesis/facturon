import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { join, resolve } from 'path';
import pino, { Logger, LevelWithSilent } from 'pino';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
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

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error';
interface Entry {
  logger: Logger;
  streams: DailyFileStream[];
}

/** Datos minimos de la empresa que aparecen en cada registro de operacion. */
export interface TenantIdentity {
  slug: string;
  ruc: string;
  nombreComercial: string;
  logLevel?: Level;
}

export type OperationResult = 'ok' | 'error' | 'omitido';

/**
 * Un logger (y una carpeta logs/<slug>/) por empresa.
 * - Dentro de un request o tarea con tenant en el contexto (CLS), current() devuelve el logger de esa empresa.
 * - Fuera de contexto cae en logs/_system/.
 * Tambien actua como logger de Nest (app.useLogger).
 */
@Injectable()
export class TenantLoggerService implements LoggerService, OnModuleDestroy {
  private readonly entries = new Map<string, Entry>();
  private readonly logsDir: string;
  private readonly defaultLevel: Level;
  private readonly retentionDays: number;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly cls: ClsService,
  ) {
    this.logsDir = resolve(config.logsDir);
    this.defaultLevel = config.logLevel;
    this.retentionDays = config.logRetentionDays;
  }

  /** Logger de una empresa concreta (se crea y cachea en el primer uso). */
  forTenant(slug: string, level?: Level): Logger {
    return this.entry(slug, level).logger;
  }

  /** Logger de la empresa del contexto actual, o _system si no hay. */
  current(): Logger {
    const slug = this.cls.isActive()
      ? this.cls.get<string | undefined>('tenantSlug')
      : undefined;
    const level = this.cls.isActive()
      ? this.cls.get<Level | undefined>('tenantLogLevel')
      : undefined;
    return this.forTenant(slug ?? SYSTEM_SLUG, level);
  }

  /** Cambia el nivel de una empresa en caliente (p. ej. debug solo para ella). */
  setLevel(slug: string, level: Level): void {
    this.entry(slug).logger.level = level; // crea el logger si aun no existia, asi el nivel no se pierde
  }

  /**
   * Registro de auditoria: QUE EMPRESA ejecuta QUE accion y con que resultado.
   * Va al log de esa empresa (logs/<slug>/app-*.log; los errores tambien a error-*.log) con
   * empresaRuc, empresaNombre, accion, resultado, requestId/correlationId y la hora (campo time).
   * `meta` no debe contener secretos; ademas pino censura pass/token/apiKey/etc.
   */
  operation(
    tenant: TenantIdentity,
    accion: string,
    resultado: OperationResult,
    meta: Record<string, unknown> = {},
  ) {
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
    if (resultado === 'error') log.error(payload, msg);
    else log.info(payload, msg);
  }

  /**
   * Ejecuta `fn` y deja constancia (empresa, accion, resultado, duracion) en el log de la empresa.
   * Si `fn` lanza, registra el error con su stack y lo relanza. `okMeta` puede derivar datos
   * del resultado (p. ej. cantidad de filas) sin loguear el contenido.
   */
  async audited<T>(
    tenant: TenantIdentity,
    accion: string,
    fn: () => Promise<T>,
    okMeta?: (result: T) => Record<string, unknown>,
    meta: Record<string, unknown> = {},
  ): Promise<T> {
    const started = Date.now();
    try {
      const result = await fn();
      this.operation(tenant, accion, 'ok', {
        ...meta,
        ...(okMeta ? okMeta(result) : {}),
        ms: Date.now() - started,
      });
      return result;
    } catch (err) {
      this.operation(tenant, accion, 'error', {
        ...meta,
        ms: Date.now() - started,
        err: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  // ---- API corta para servicios ----
  // meta puede ser un objeto (uso en servicios) o un string de contexto (formato que usa Nest internamente)
  info(msg: string, meta?: Record<string, unknown> | string) {
    this.current().info(this.asMeta(meta), msg);
  }
  warn(msg: unknown, ...rest: unknown[]) {
    this.nest('warn', msg, rest);
  }
  debug(msg: unknown, ...rest: unknown[]) {
    this.nest('debug', msg, rest);
  }
  errorWith(msg: string, err: unknown, meta: Record<string, unknown> = {}) {
    this.current().error(
      { ...meta, err: err instanceof Error ? err : new Error(String(err)) },
      msg,
    );
  }

  // ---- Contrato LoggerService de Nest ----
  log(message: unknown, ...rest: unknown[]) {
    this.nest('info', message, rest);
  }
  error(message: unknown, ...rest: unknown[]) {
    this.nest('error', message, rest);
  }
  verbose(message: unknown, ...rest: unknown[]) {
    this.nest('trace', message, rest);
  }
  fatal(message: unknown, ...rest: unknown[]) {
    this.nest('error', message, rest);
  }

  onModuleDestroy() {
    for (const e of this.entries.values()) e.streams.forEach((s) => s.end());
    this.entries.clear();
  }

  private entry(slug: string, level?: Level): Entry {
    if (slug !== SYSTEM_SLUG && !SLUG_RE.test(slug)) slug = SYSTEM_SLUG; // evita path traversal
    let e = this.entries.get(slug);
    if (!e) {
      const dir = join(this.logsDir, slug);
      const app = new DailyFileStream(dir, 'app', this.retentionDays);
      const err = new DailyFileStream(dir, 'error', this.retentionDays);
      const logger = pino(
        {
          level: level ?? this.defaultLevel,
          base: { tenant: slug },
          redact: { paths: REDACT, censor: '[REDACTED]' },
          serializers: { err: pino.stdSerializers.err },
          timestamp: pino.stdTimeFunctions.isoTime,
        },
        pino.multistream([
          { level: 'trace' as LevelWithSilent, stream: app },
          { level: 'error' as LevelWithSilent, stream: err },
          // tambien a consola, para ver el servicio en vivo
          { level: 'info' as LevelWithSilent, stream: process.stdout },
        ]),
      );
      e = { logger, streams: [app, err] };
      this.entries.set(slug, e);
    }
    return e;
  }

  private asMeta(
    meta?: Record<string, unknown> | string,
  ): Record<string, unknown> {
    return typeof meta === 'string' ? { context: meta } : (meta ?? {});
  }

  private nest(level: Level, message: unknown, rest: unknown[]) {
    const last = rest[rest.length - 1];
    if (last && typeof last === 'object' && !(last instanceof Error)) {
      // uso desde servicios: logger.warn('msg', { claveAcceso })
      const text =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.current()[level](last as Record<string, unknown>, text);
      return;
    }
    const context = typeof last === 'string' ? last : undefined;
    const stack =
      level === 'error' && typeof rest[0] === 'string' && rest.length > 1
        ? (rest[0] as string)
        : undefined;
    const log = this.current();
    const payload: Record<string, unknown> = { context };
    if (stack) payload.stack = stack;
    if (message instanceof Error) {
      log[level]({ ...payload, err: message }, message.message);
    } else {
      log[level](
        payload,
        typeof message === 'string' ? message : JSON.stringify(message),
      );
    }
  }
}
