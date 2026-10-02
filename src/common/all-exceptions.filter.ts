import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';

/** Respuesta de error uniforme + el error completo (con stack) en el log de la empresa. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: TenantLoggerService,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : undefined;
    const message =
      typeof body === 'string'
        ? body
        : ((body as { message?: unknown })?.message ??
          'Error interno del servidor');
    const requestId = this.cls.getId();

    const log = this.logger.current();
    const meta = {
      event: 'http.error',
      requestId,
      method: req.method,
      path: req.path,
      status,
      empresaRuc: this.cls.get<string | undefined>('tenantRuc'),
      empresaNombre: this.cls.get<string | undefined>('tenantName'),
    };
    if (status >= 500) {
      log.error(
        {
          ...meta,
          err:
            exception instanceof Error
              ? exception
              : new Error(String(exception)),
        },
        'Error no controlado',
      );
    } else {
      log.warn({ ...meta, reason: message }, 'Request rechazado');
    }

    // un @Header() del handler (p. ej. application/xml) no debe aplicarse a la respuesta de error
    res.removeHeader('Content-Type');

    // Contratos legacy (p. ej. {success:false,msg}) se devuelven tal cual, sin envolver.
    if (
      body &&
      typeof body === 'object' &&
      (body as { legacy?: boolean }).legacy === true
    ) {
      const { legacy: _legacy, ...legacyBody } = body as Record<
        string,
        unknown
      >;
      res.status(status).json(legacyBody);
      return;
    }

    res.status(status).json({
      statusCode: status,
      message: status >= 500 ? 'Error interno del servidor' : message,
      requestId,
    });
  }
}
