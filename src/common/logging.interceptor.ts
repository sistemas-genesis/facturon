import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable, tap } from 'rxjs';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';

/** Registra cada request en el log de SU empresa: empresa (RUC y nombre), metodo, ruta, status y duracion. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: TenantLoggerService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const started = Date.now();
    const base = {
      event: 'http.request',
      requestId: this.cls.getId(),
      method: req.method,
      path: req.path,
    };
    const empresa = () => ({
      empresaRuc: this.cls.get<string | undefined>('tenantRuc'),
      empresaNombre: this.cls.get<string | undefined>('tenantName'),
    });

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.current().info(
            {
              ...base,
              ...empresa(),
              status: res.statusCode,
              ms: Date.now() - started,
            },
            'request',
          ),
        // los errores los registra AllExceptionsFilter con mas detalle
      }),
    );
  }
}
