import { OnModuleInit } from '@nestjs/common';
import { type AppConfig } from '../config/app-config.js';
import { type RideTipo } from '../common/sri-xml.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
export interface RideResult {
    file: string;
    path: string;
    tenant: Tenant;
}
export declare class RideService implements OnModuleInit {
    private readonly settings;
    private readonly registry;
    private readonly tenantContext;
    private readonly logger;
    private readonly printer;
    readonly pdfDir: string;
    constructor(config: AppConfig, settings: TenantSettings, registry: TenantRegistry, tenantContext: TenantContext, logger: TenantLoggerService);
    private readonly pdfTtlMs;
    onModuleInit(): void;
    generate(tipo: RideTipo, xml: string, fechaAutorizacion: string): Promise<RideResult>;
    resolvePdf(file: string): string | undefined;
    private envFor;
    private barcode;
    private leyendaCatastro;
    private safeName;
    private write;
}
