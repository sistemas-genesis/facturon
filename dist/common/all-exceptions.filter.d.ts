import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    private readonly cls;
    constructor(logger: TenantLoggerService, cls: ClsService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
