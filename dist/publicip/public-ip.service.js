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
import { APP_JSON } from '../config/app-json.js';
import { SYSTEM_SLUG, TenantLoggerService, } from '../logger/tenant-logger.service.js';
let PublicIpService = class PublicIpService {
    json;
    logger;
    ip;
    constructor(json, logger) {
        this.json = json;
        this.logger = logger;
    }
    onModuleInit() {
        const url = this.json.server.publicIpUrl;
        if (!url)
            return;
        fetch(url, { signal: AbortSignal.timeout(5000) })
            .then(async (r) => {
            if (r.ok)
                this.ip = (await r.text()).trim();
        })
            .catch((err) => this.logger
            .forTenant(SYSTEM_SLUG)
            .warn({ event: 'publicip.failed', err }, 'No se pudo obtener la IP publica'));
    }
};
PublicIpService = __decorate([
    Injectable(),
    __param(0, Inject(APP_JSON)),
    __metadata("design:paramtypes", [Object, TenantLoggerService])
], PublicIpService);
export { PublicIpService };
//# sourceMappingURL=public-ip.service.js.map