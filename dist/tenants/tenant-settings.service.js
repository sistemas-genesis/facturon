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
import { APP_JSON, } from '../config/app-json.js';
let TenantSettings = class TenantSettings {
    json;
    constructor(json) {
        this.json = json;
    }
    defaults() {
        return this.json.defaults;
    }
    for(t) {
        const d = this.json.defaults;
        return {
            soap: t.soap ?? d.soap,
            genesisIp: t.genesisIp ?? d.genesisIp,
            facturonURL: t.facturonURL ?? d.facturonURL,
            whatsappBaseUrl: t.whatsapp?.baseUrl ?? d.whatsapp.baseUrl,
            tables: t.tables ?? d.tables,
            mailTask: t.mailTask ?? d.mailTask,
            RIDE: t.ride?.RIDE ?? d.ride.RIDE,
            mailTemplate: t.ride?.mailTemplate ?? d.ride.mailTemplate,
            sri: d.sri,
        };
    }
};
TenantSettings = __decorate([
    Injectable(),
    __param(0, Inject(APP_JSON)),
    __metadata("design:paramtypes", [Object])
], TenantSettings);
export { TenantSettings };
//# sourceMappingURL=tenant-settings.service.js.map