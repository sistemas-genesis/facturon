import { z } from 'zod';
import type { AppJson } from './app-json.js';

export const APP_CONFIG = Symbol('APP_CONFIG');

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  /** Interfaz de escucha. 127.0.0.1 = solo esta maquina. */
  host: string;
  port: number;
  /** Carpeta con un JSON por empresa (ruta tal cual viene del entorno). */
  tenantsDir: string;
  /** Carpeta raiz de logs: logs/<slug>/app-YYYY-MM-DD.log */
  logsDir: string;
  logLevel: LogLevel;
  logRetentionDays: number;
  /** Limite del body JSON/urlencoded (el legacy aceptaba 500mb). */
  bodyLimit: string;
  /** Carpeta de estaticos del front (index.html, config.html, js, css). */
  publicDir: string;
  /** Carpeta de PDF de RIDE generados. */
  pdfDir: string;
  pdfTtlMs: number;
}

type Env = Record<string, string | undefined>;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(3090),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  TENANTS_DIR: z.string().default('./config/tenants'),
  LOGS_DIR: z.string().default('./logs'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
  LOG_RETENTION_DAYS: z.coerce.number().int().min(1).default(30),
  BODY_LIMIT: z.string().default('500mb'),
  PUBLIC_DIR: z.string().default('./public'),
  PDF_DIR: z.string().default('./tmp/pdf'),
  PDF_TTL_MS: z.coerce.number().int().min(0).default(30000),
});

/**
 * Valores por defecto tomados de config/app.config.json (seccion "server").
 * Una variable de entorno, si existe, tiene prioridad sobre el JSON.
 */
export function envFromServerJson(server: AppJson['server']): Env {
  return {
    PORT: String(server.port),
    API_HOST: server.host,
    TENANTS_DIR: server.tenantsDir,
    LOGS_DIR: server.logsDir,
    LOG_LEVEL: server.logLevel,
    LOG_RETENTION_DAYS: String(server.logRetentionDays),
    BODY_LIMIT: server.bodyLimit,
    PUBLIC_DIR: server.publicDir,
    PDF_DIR: server.pdfDir,
    PDF_TTL_MS: String(server.pdfTtlMs),
  };
}

/**
 * Parsea y valida el entorno en un solo lugar. Lanza UN error con todos los
 * problemas, asi el proceso falla al arrancar y no en el primer request.
 */
export function parseConfig(env: Env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n - ');
    throw new Error(`Invalid configuration:\n - ${detail}`);
  }
  const v = parsed.data;
  return {
    nodeEnv: v.NODE_ENV,
    port: v.PORT,
    host: v.API_HOST,
    tenantsDir: v.TENANTS_DIR,
    logsDir: v.LOGS_DIR,
    logLevel: v.LOG_LEVEL,
    logRetentionDays: v.LOG_RETENTION_DAYS,
    bodyLimit: v.BODY_LIMIT,
    publicDir: v.PUBLIC_DIR,
    pdfDir: v.PDF_DIR,
    pdfTtlMs: v.PDF_TTL_MS,
  };
}
