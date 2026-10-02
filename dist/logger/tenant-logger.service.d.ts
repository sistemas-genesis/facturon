import { LoggerService, OnModuleDestroy } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'pino';
import { type AppConfig } from '../config/app-config.js';
export declare const SYSTEM_SLUG = "_system";
type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export interface TenantIdentity {
    slug: string;
    ruc: string;
    nombreComercial: string;
    logLevel?: Level;
}
export type OperationResult = 'ok' | 'error' | 'omitido';
export declare class TenantLoggerService implements LoggerService, OnModuleDestroy {
    private readonly cls;
    private readonly entries;
    private readonly logsDir;
    private readonly defaultLevel;
    private readonly retentionDays;
    constructor(config: AppConfig, cls: ClsService);
    forTenant(slug: string, level?: Level): Logger;
    current(): Logger;
    setLevel(slug: string, level: Level): void;
    operation(tenant: TenantIdentity, accion: string, resultado: OperationResult, meta?: Record<string, unknown>): void;
    audited<T>(tenant: TenantIdentity, accion: string, fn: () => Promise<T>, okMeta?: (result: T) => Record<string, unknown>, meta?: Record<string, unknown>): Promise<T>;
    info(msg: string, meta?: Record<string, unknown> | string): void;
    warn(msg: unknown, ...rest: unknown[]): void;
    debug(msg: unknown, ...rest: unknown[]): void;
    errorWith(msg: string, err: unknown, meta?: Record<string, unknown>): void;
    log(message: unknown, ...rest: unknown[]): void;
    error(message: unknown, ...rest: unknown[]): void;
    verbose(message: unknown, ...rest: unknown[]): void;
    fatal(message: unknown, ...rest: unknown[]): void;
    onModuleDestroy(): void;
    private entry;
    private asMeta;
    private nest;
}
export {};
