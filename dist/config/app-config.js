import { z } from 'zod';
export const APP_CONFIG = Symbol('APP_CONFIG');
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
export function envFromServerJson(server) {
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
export function parseConfig(env) {
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
//# sourceMappingURL=app-config.js.map