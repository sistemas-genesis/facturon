import type { AppJson } from './app-json.js';
export declare const APP_CONFIG: unique symbol;
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export interface AppConfig {
    nodeEnv: 'development' | 'production' | 'test';
    host: string;
    port: number;
    tenantsDir: string;
    logsDir: string;
    logLevel: LogLevel;
    logRetentionDays: number;
    bodyLimit: string;
    publicDir: string;
    pdfDir: string;
    pdfTtlMs: number;
}
type Env = Record<string, string | undefined>;
export declare function envFromServerJson(server: AppJson['server']): Env;
export declare function parseConfig(env: Env): AppConfig;
export {};
