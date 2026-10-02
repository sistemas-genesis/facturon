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
        try {
            const res = await fetch(`${this.settings.for(tenant).whatsappBaseUrl}/phones/token/${encodeURIComponent(phoneNumberId)}`, { method: 'POST' });
            if (!res.ok) {
                this.logger.operation(tenant, 'whatsapp.token', 'error', {
                    status: res.status,
                });
                return null;
            }
            const body = (await res.json());
            return body.token ?? null;
        }
        catch (err) {
            this.logger.operation(tenant, 'whatsapp.token', 'error', {
                err: err instanceof Error ? err : new Error(String(err)),
            });
            return null;
        }
    }
    async send(tenant, token, options) {
        if (!options.phone)
            throw new Error('Falta el numero celular');
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
        }
        catch (err) {
            this.logger.operation(tenant, 'whatsapp.enviar', 'error', {
                err: err instanceof Error ? err : new Error(String(err)),
            });
            return false;
        }
    }
};
WhatsAppService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        TenantLoggerService])
], WhatsAppService);
export { WhatsAppService };
//# sourceMappingURL=whatsapp.service.js.map