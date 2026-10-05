var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../config/app-config.js';
import { PublicIpService } from '../publicip/public-ip.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
const MASK = '********';
let ParamsService = class ParamsService {
    settings;
    config;
    registry;
    publicIp;
    constructor(settings, config, registry, publicIp) {
        this.settings = settings;
        this.config = config;
        this.registry = registry;
        this.publicIp = publicIp;
    }
    empresas() {
        return this.registry
            .list()
            .filter((t) => t.enabled)
            .map((t) => ({
            db: t.db.db,
            ruc: t.ruc,
            img: t.logo?.path,
            empresa: t.nombreComercial,
            estacion: t.estacion,
            punto: t.punto,
            mailsDefault: t.mailsDefault,
            publicip: this.publicIp.ip,
        }));
    }
    publicip() {
        return { ip: this.publicIp.ip };
    }
    panelConfig() {
        const d = this.settings.defaults();
        return {
            host: this.config.host,
            port: this.config.port,
            soap: d.soap,
            genesisIp: d.genesisIp,
            tables: d.tables,
            facturonURL: d.facturonURL,
            mailTask: d.mailTask,
            databases: this.registry.list().map((t) => this.legacyDatabase(t)),
        };
    }
    legacyDatabase(t) {
        const hide = (v) => (v ? MASK : v);
        return {
            slug: t.slug,
            enabled: t.enabled,
            user: t.db.user,
            pass: hide(t.db.pass),
            port: String(t.db.port),
            db: t.db.db,
            host: t.db.host,
            ruc: t.ruc,
            img: t.logo?.path,
            imgWidth: t.logo?.width,
            imgHeight: t.logo?.height,
            nombreComercial: t.nombreComercial,
            mail: t.mail && {
                ...t.mail,
                auth: {
                    ...t.mail.auth,
                    ...(typeof t.mail.auth.pass === 'string' && {
                        pass: hide(t.mail.auth.pass),
                    }),
                    ...(typeof t.mail.auth.clientSecret === 'string' && {
                        clientSecret: hide(t.mail.auth.clientSecret),
                    }),
                    ...(typeof t.mail.auth.refreshToken === 'string' && {
                        refreshToken: hide(t.mail.auth.refreshToken),
                    }),
                },
            },
            mailsDefault: t.mailsDefault,
            estacion: t.estacion,
            punto: t.punto,
            leyenda_catastro: t.leyenda_catastro,
            subsidio: t.subsidio,
            phoneNumerId: t.whatsapp?.phoneNumberId,
            overrides: {
                soap: t.soap,
                genesisIp: t.genesisIp,
                facturonURL: t.facturonURL,
                tables: t.tables,
                whatsappBaseUrl: t.whatsapp?.baseUrl,
                mailTask: t.mailTask,
            },
        };
    }
};
ParamsService = __decorate([
    Injectable(),
    __param(1, Inject(APP_CONFIG)),
    __metadata("design:paramtypes", [TenantSettings, Object, TenantRegistry,
        PublicIpService])
], ParamsService);
export { ParamsService };
//# sourceMappingURL=params.service.js.map