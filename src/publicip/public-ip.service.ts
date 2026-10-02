import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { APP_JSON, type AppJson } from '../config/app-json.js';
import {
  SYSTEM_SLUG,
  TenantLoggerService,
} from '../logger/tenant-logger.service.js';

/** IPv4 publica del servidor (el front la usa para saber si se accede desde fuera). */
@Injectable()
export class PublicIpService implements OnModuleInit {
  ip: string | undefined;

  constructor(
    @Inject(APP_JSON) private readonly json: AppJson,
    private readonly logger: TenantLoggerService,
  ) {}

  /** No bloquea el arranque: si el servicio no responde, la IP queda sin definir. */
  onModuleInit() {
    const url = this.json.server.publicIpUrl;
    if (!url) return;
    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then(async (r) => {
        if (r.ok) this.ip = (await r.text()).trim();
      })
      .catch((err) =>
        this.logger
          .forTenant(SYSTEM_SLUG)
          .warn(
            { event: 'publicip.failed', err },
            'No se pudo obtener la IP publica',
          ),
      );
  }
}
