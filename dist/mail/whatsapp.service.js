var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
const DEFAULT_TEXT = 'Hola 👋\n\nTe compartimos tu factura puedes revisarla en el siguiente pdf. Si tienes alguna duda, estamos a tu disposición.\n\n¡Gracias por tu confianza!';
let WhatsAppService = class WhatsAppService {
    settings;
    logger;
    constructor(settings, logger) {
        this.settings = settings;
        this.logger = logger;
    }
    async generateToken(tenant, phoneNumberId) {
        const r = await this.requestToken(tenant, phoneNumberId);
        return r.ok ? r.token : null;
    }
    async requestToken(tenant, phoneNumberId) {
        const rawBase = this.settings.for(tenant).whatsappBaseUrl;
        if (!rawBase)
            return fail('disabled', 'WhatsApp no esta habilitado para esta empresa');
        const baseUrl = rawBase.trim().replace(/\/+$/, '');
        const id = String(phoneNumberId ?? '').trim();
        const masked = maskId(id);
        const ctx = `phoneNumberId ${masked}, servidor ${safeOrigin(baseUrl)}`;
        const report = (r, extra = {}) => {
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
            return report(fail('phone_id_invalid', `El phoneNumberId configurado no es valido (${ctx}, ${id.length} caracteres; se esperaba un UUID de 36). Revise la configuracion de la empresa`));
        try {
            const res = await fetch(`${baseUrl}/phones/token/${id}`, {
                method: 'POST',
            });
            const text = await res.text();
            if (res.status === 401 || res.status === 403)
                return report(fail('token', `El servicio de WhatsApp rechazo la solicitud de token (${res.status}; ${ctx})`, res.status), { status: res.status });
            if (res.status === 404 || (res.ok && text.trim() === 'false'))
                return report(fail('phone_not_found', `El phoneNumberId no existe en el servidor de WhatsApp (${ctx}). Verifique que este completo y sin espacios`, res.status), { status: res.status });
            if (!res.ok)
                return report(fail('unavailable', `El servicio de WhatsApp respondio ${res.status} al pedir el token (${ctx})`, res.status), { status: res.status });
            let token;
            try {
                const body = JSON.parse(text);
                token = body?.token ?? body?.access_token;
            }
            catch {
                token = undefined;
            }
            if (typeof token !== 'string' || !token.trim())
                return report(fail('token', `Respuesta inesperada del servicio de WhatsApp al pedir el token (${ctx})`, res.status), { status: res.status, bodyLength: text.length });
            return { ok: true, token: token.trim() };
        }
        catch (err) {
            return report(fail('unavailable', `No se pudo conectar con el servicio de WhatsApp (${ctx})`), { err: err instanceof Error ? err : new Error(String(err)) });
        }
    }
    static normalizePhone(raw) {
        if (!raw)
            return null;
        for (const part of String(raw).split(/[,;/]/)) {
            let d = part.replace(/\D/g, '');
            if (d.startsWith('00'))
                d = d.slice(2);
            if (d.startsWith('593'))
                d = d.slice(3);
            else if (d.startsWith('0'))
                d = d.slice(1);
            if (/^9\d{8}$/.test(d))
                return `593${d}`;
        }
        return null;
    }
    async deliver(tenant, phoneNumberId, options) {
        if (!this.settings.for(tenant).whatsappBaseUrl)
            return fail('disabled', 'WhatsApp no esta habilitado para esta empresa');
        let last = fail('token', 'No se pudo obtener el token de WhatsApp');
        for (let intento = 0; intento < 2; intento++) {
            const t = await this.requestToken(tenant, phoneNumberId);
            if (!t.ok)
                return t;
            last = await this.post(tenant, t.token, options);
            if (last.ok || last.reason !== 'token_expired')
                return last;
        }
        return last;
    }
    async send(tenant, token, options) {
        if (!options.phone)
            throw new Error('Falta el numero celular');
        return (await this.post(tenant, token, options)).ok;
    }
    async post(tenant, token, options) {
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
                    .then((b) => String(b?.message ?? ''))
                    .catch(() => '');
                if (res.status === 401) {
                    this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
                        status: 401,
                        motivo: 'token de WhatsApp expirado o invalido',
                        detalle,
                    });
                    return fail('token_expired', 'El token de WhatsApp esta expirado o es invalido', 401);
                }
                this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
                    status: res.status,
                    detalle,
                });
                return fail('http', `El servicio de WhatsApp respondio ${res.status}`, res.status);
            }
            this.logger.operation(tenant, 'whatsapp.enviar', 'ok');
            return { ok: true };
        }
        catch (err) {
            this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
                err: err instanceof Error ? err : new Error(String(err)),
            });
            return fail('network', 'No se pudo conectar con el servicio de WhatsApp');
        }
    }
};
WhatsAppService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        TenantLoggerService])
], WhatsAppService);
export { WhatsAppService };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function maskId(id) {
    return id.length <= 8
        ? `${id.slice(0, 2)}***`
        : `${id.slice(0, 4)}...${id.slice(-4)}`;
}
function safeOrigin(url) {
    try {
        return new URL(url).origin;
    }
    catch {
        return '(baseUrl invalido)';
    }
}
function fail(reason, message, status) {
    return { ok: false, reason, message, status };
}
//# sourceMappingURL=whatsapp.service.js.map