import { OnModuleInit } from '@nestjs/common';
import { type AppJson } from '../config/app-json.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
export declare class PublicIpService implements OnModuleInit {
    private readonly json;
    private readonly logger;
    ip: string | undefined;
    constructor(json: AppJson, logger: TenantLoggerService);
    onModuleInit(): void;
}
