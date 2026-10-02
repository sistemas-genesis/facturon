import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { type MailTaskConfig } from '../config/app-json.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import { MailService } from './mail.service.js';
export declare class MailTaskService implements OnModuleInit, OnModuleDestroy {
    private readonly settings;
    private readonly registry;
    private readonly scheduler;
    private readonly db;
    private readonly mail;
    private readonly logger;
    private readonly running;
    constructor(settings: TenantSettings, registry: TenantRegistry, scheduler: SchedulerRegistry, db: SybaseService, mail: MailService, logger: TenantLoggerService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    tick(slug: string, cfg: MailTaskConfig): Promise<void>;
    private procesar;
}
