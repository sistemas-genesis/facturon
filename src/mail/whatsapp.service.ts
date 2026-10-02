import { Injectable } from '@nestjs/common';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';

const DEFAULT_TEXT =
  'Hola 👋\n\nTe compartimos tu factura puedes revisarla en el siguiente pdf. Si tienes alguna duda, estamos a tu disposición.\n\n¡Gracias por tu confianza!';

/**
 * Cliente del servicio WhatsApp Genesis (WhatsAppGenesis.js del legacy).
 * A diferencia del legacy, el token NO se comparte entre empresas: cada envio usa el suyo.
 */
@Injectable()
export class WhatsAppService {
  constructor(
    private readonly settings: TenantSettings,
    private readonly logger: TenantLoggerService,
  ) {}

  /** POST {baseUrl}/phones/token/{phoneNumberId}; null si falla (no interrumpe el envio de correo). */
  async generateToken(
    tenant: Tenant,
    phoneNumberId: string,
  ): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.settings.for(tenant).whatsappBaseUrl}/phones/token/${encodeURIComponent(phoneNumberId)}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        this.logger.operation(tenant, 'whatsapp.token', 'error', {
          status: res.status,
        });
        return null;
      }
      const body = (await res.json()) as { token?: string };
      return body.token ?? null;
    } catch (err) {
      this.logger.operation(tenant, 'whatsapp.token', 'error', {
        err: err instanceof Error ? err : new Error(String(err)),
      });
      return null;
    }
  }

  /** POST {baseUrl}/messages/send con el PDF en base64. Un fallo se registra pero no se propaga. */
  async send(
    tenant: Tenant,
    token: string,
    options: { phone: string; pdfBase64: string; text?: string },
  ): Promise<boolean> {
    if (!options.phone) throw new Error('Falta el numero celular');
    const body = {
      jid: `${options.phone}@s.whatsapp.net`,
      type: 'number',
      file: { base64: options.pdfBase64, name: 'Factura' },
      message: { text: options.text ?? DEFAULT_TEXT, mentions: [] },
    };
    try {
      const res = await fetch(`${this.settings.for(tenant).whatsappBaseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
          status: res.status,
        });
        return false;
      }
      this.logger.operation(tenant, 'whatsapp.enviar', 'ok');
      return true;
    } catch (err) {
      this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
        err: err instanceof Error ? err : new Error(String(err)),
      });
      return false;
    }
  }
}
