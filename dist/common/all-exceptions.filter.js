var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Catch, HttpException, HttpStatus, } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
let AllExceptionsFilter = class AllExceptionsFilter {
    logger;
    cls;
    constructor(logger, cls) {
        this.logger = logger;
        this.cls = cls;
    }
    catch(exception, host) {
        const http = host.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const isHttp = exception instanceof HttpException;
        const status = isHttp
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const body = isHttp ? exception.getResponse() : undefined;
        const message = typeof body === 'string'
            ? body
            : (body?.message ??
                'Error interno del servidor');
        const requestId = this.cls.getId();
        const log = this.logger.current();
        const meta = {
            event: 'http.error',
            requestId,
            method: req.method,
            path: req.path,
            status,
            empresaRuc: this.cls.get('tenantRuc'),
            empresaNombre: this.cls.get('tenantName'),
        };
        if (status >= 500) {
            log.error({
                ...meta,
                err: exception instanceof Error
                    ? exception
                    : new Error(String(exception)),
            }, 'Error no controlado');
        }
        else {
            log.warn({ ...meta, reason: message }, 'Request rechazado');
        }
        res.removeHeader('Content-Type');
        if (body &&
            typeof body === 'object' &&
            body.legacy === true) {
            const { legacy: _legacy, ...legacyBody } = body;
            res.status(status).json(legacyBody);
            return;
        }
        res.status(status).json({
            statusCode: status,
            message: status >= 500 ? 'Error interno del servidor' : message,
            requestId,
        });
    }
};
AllExceptionsFilter = __decorate([
    Catch(),
    __metadata("design:paramtypes", [TenantLoggerService,
        ClsService])
], AllExceptionsFilter);
export { AllExceptionsFilter };
//# sourceMappingURL=all-exceptions.filter.js.map