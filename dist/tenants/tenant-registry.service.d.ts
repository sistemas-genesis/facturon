import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { type AppConfig } from '../config/app-config.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { Tenant } from './tenant.types.js';
export declare class TenantRegistry implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private tenants;
    private readonly dir;
    private watcher?;
    private timer?;
    constructor(config: AppConfig, logger: TenantLoggerService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    list(): Tenant[];
    getBySlug(slug: string): Tenant | undefined;
    findByDb(db: string): Tenant[];
    findByRuc(ruc: string): Tenant[];
    selectByRuc(ruc: string, estab?: string, ptoEmi?: string): Tenant | undefined;
    distinctDatabases(): Tenant[];
    reload(): {
        loaded: number;
        errors: string[];
    };
}
