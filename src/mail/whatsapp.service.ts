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

  /** Como requestToken pero devuelve solo el token (null si falla; el motivo queda en el log). */
  async generateToken(
    tenant: Tenant,
    phoneNumberId: string,
  ): Promise<string | null> {
    const r = await this.requestToken(tenant, phoneNumberId);
    return r.ok ? r.token : null;
  }

  /**
   * POST {baseUrl}/phones/token/{phoneNumberId}. Distingue la causa del fallo y la registra (con el
   * phoneNumberId enmascarado y el baseUrl, nunca el token). El servidor responde 201 con body `false`
   * (no 404) cuando el phoneNumberId no existe, por eso se lee como texto y se parsea con tolerancia.
   */
  async requestToken(
    tenant: Tenant,
    phoneNumberId: string,
  ): Promise<TokenResult> {
    const rawBase = this.settings.for(tenant).whatsappBaseUrl;
    if (!rawBase)
      return fail('disabled', 'WhatsApp no esta habilitado para esta empresa');
    const baseUrl = rawBase.trim().replace(/\/+$/, '');
    const id = String(phoneNumberId ?? '').trim();
    const masked = maskId(id);
    const ctx = `phoneNumberId ${masked}, servidor ${safeOrigin(baseUrl)}`;
    const report = (r: Extract<TokenResult, { ok: false }>, extra = {}) => {
      this.logger.operation(tenant, 'whatsapp.token', 'error', {
        reason: r.reason,
        phoneNumberId: masked,
        baseUrl: safeOrigin(baseUrl),
        motivo: r.message,
        ...extra,
      });
      return r;
    };
    if (!UUID_RE.test(id))
      return report(
        fail(
          'phone_id_invalid',
          `El phoneNumberId configurado no es valido (${ctx}, ${id.length} caracteres; se esperaba un UUID de 36). Revise la configuracion de la empresa`,
        ),
      );
    try {
      const res = await fetch(`${baseUrl}/phones/token/${id}`, {
        method: 'POST',
      });
      const text = await res.text();
      if (res.status === 401 || res.status === 403)
        return report(
          fail(
            'token',
            `El servicio de WhatsApp rechazo la solicitud de token (${res.status}; ${ctx})`,
            res.status,
          ),
          { status: res.status },
        );
      if (res.status === 404 || (res.ok && text.trim() === 'false'))
        return report(
          fail(
            'phone_not_found',
            `El phoneNumberId no existe en el servidor de WhatsApp (${ctx}). Verifique que este completo y sin espacios`,
            res.status,
          ),
          { status: res.status },
        );
      if (!res.ok)
        return report(
          fail(
            'unavailable',
            `El servicio de WhatsApp respondio ${res.status} al pedir el token (${ctx})`,
            res.status,
          ),
          { status: res.status },
        );
      let token: unknown;
      try {
        const body = JSON.parse(text) as Record<string, unknown> | null;
        token = body?.token ?? body?.access_token;
      } catch {
        token = undefined;
      }
      if (typeof token !== 'string' || !token.trim())
        return report(
          fail(
            'token',
            `Respuesta inesperada del servicio de WhatsApp al pedir el token (${ctx})`,
            res.status,
          ),
          { status: res.status, bodyLength: text.length },
        );
      return { ok: true, token: token.trim() };
    } catch (err) {
      return report(
        fail(
          'unavailable',
          `No se pudo conectar con el servicio de WhatsApp (${ctx})`,
        ),
        { err: err instanceof Error ? err : new Error(String(err)) },
      );
    }
  }

  /**
   * Normaliza un celular ecuatoriano a formato internacional sin '+' (593 + 9 digitos que empiezan en 9).
   * Acepta "0991234567", "991234567", "+593 99 123 4567", "593991234567" y varios numeros separados por
   * , ; / (usa el primer celular valido). Devuelve null si no hay un celular valido (p. ej. convencionales).
   */
  static normalizePhone(raw: string | null | undefined): string | null {
    if (!raw) return null;
    for (const part of String(raw).split(/[,;/]/)) {
      let d = part.replace(/\D/g, '');
      if (d.startsWith('00')) d = d.slice(2);
      if (d.startsWith('593')) d = d.slice(3);
      else if (d.startsWith('0')) d = d.slice(1);
      if (/^9\d{8}$/.test(d)) return `593${d}`;
    }
    return null;
  }

  /**
   * Envia el PDF: pide un token nuevo (el token no se guarda ni se configura), y si el servicio
   * responde 401 (token expirado/invalido) pide otro y reintenta una vez. Nunca lanza: devuelve el
   * resultado para que el llamador decida (el correo automatico lo ignora; el boton lo muestra).
   */
  async deliver(
    tenant: Tenant,
    phoneNumberId: string,
    options: {
      phone: string;
      pdfBase64: string;
      text?: string;
      fileName?: string;
    },
  ): Promise<WhatsAppResult> {
    if (!this.settings.for(tenant).whatsappBaseUrl)
      return fail('disabled', 'WhatsApp no esta habilitado para esta empresa');
    let last: WhatsAppResult = fail(
      'token',
      'No se pudo obtener el token de WhatsApp',
    );
    for (let intento = 0; intento < 2; intento++) {
      const t = await this.requestToken(tenant, phoneNumberId);
      if (!t.ok) return t;
      last = await this.post(tenant, t.token, options);
      if (last.ok || last.reason !== 'token_expired') return last;
    }
    return last;
  }

  /** POST {baseUrl}/messages/send con el PDF en base64. Un fallo se registra pero no se propaga. */
  async send(
    tenant: Tenant,
    token: string,
    options: {
      phone: string;
      pdfBase64: string;
      text?: string;
      fileName?: string;
    },
  ): Promise<boolean> {
    if (!options.phone) throw new Error('Falta el numero celular');
    return (await this.post(tenant, token, options)).ok;
  }

  private async post(
    tenant: Tenant,
    token: string,
    options: {
      phone: string;
      pdfBase64: string;
      text?: string;
      fileName?: string;
    },
  ): Promise<WhatsAppResult> {
    const baseUrl = this.settings.for(tenant).whatsappBaseUrl;
    if (!baseUrl)
      return fail('disabled', 'WhatsApp no esta habilitado para esta empresa');
    const body = {
      jid: `${options.phone}@s.whatsapp.net`,
      type: 'number',
      file: { base64: options.pdfBase64, name: options.fileName ?? 'Factura' },
      message: { text: options.text ?? DEFAULT_TEXT, mentions: [] },
    };
    try {
      const res = await fetch(`${baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detalle = await res
          .json()
          .then((b: { message?: unknown }) => String(b?.message ?? ''))
          .catch(() => '');
        if (res.status === 401) {
          this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
            status: 401,
            motivo: 'token de WhatsApp expirado o invalido',
            detalle,
          });
          return fail(
            'token_expired',
            'El token de WhatsApp esta expirado o es invalido',
            401,
          );
        }
        this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
          status: res.status,
          detalle,
        });
        return fail(
          'http',
          `El servicio de WhatsApp respondio ${res.status}`,
          res.status,
        );
      }
      this.logger.operation(tenant, 'whatsapp.enviar', 'ok');
      return { ok: true };
    } catch (err) {
      this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
        err: err instanceof Error ? err : new Error(String(err)),
      });
      return fail('network', 'No se pudo conectar con el servicio de WhatsApp');
    }
  }
}

export type WhatsAppResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'disabled'
        | 'token'
        | 'token_expired'
        | 'http'
        | 'network'
        | 'phone_id_invalid'
        | 'phone_not_found'
        | 'unavailable';
      message: string;
      status?: number;
    };

type TokenResult =
  { ok: true; token: string } | Extract<WhatsAppResult, { ok: false }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Enmascara el id: primeros 4 y ultimos 4 caracteres (el id no es secreto, pero evita exponerlo completo). */
function maskId(id: string): string {
  return id.length <= 8
    ? `${id.slice(0, 2)}***`
    : `${id.slice(0, 4)}...${id.slice(-4)}`;
}

/** Solo protocolo+host+puerto (descarta credenciales/ruta). */
function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '(baseUrl invalido)';
  }
}

function fail(
  reason: Extract<WhatsAppResult, { ok: false }>['reason'],
  message: string,
  status?: number,
): Extract<WhatsAppResult, { ok: false }> {
  return { ok: false, reason, message, status };
}
