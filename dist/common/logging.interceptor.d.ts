import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly cls;
    constructor(logger: TenantLoggerService, cls: ClsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
