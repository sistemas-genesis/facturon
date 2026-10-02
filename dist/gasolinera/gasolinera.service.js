var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { sqlStr } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
let GasolineraService = class GasolineraService {
    settings;
    db;
    logger;
    constructor(settings, db, logger) {
        this.settings = settings;
        this.db = db;
        this.logger = logger;
    }
    persona(tenant, cedula) {
        return this.logger
            .audited(tenant, 'gasolinera.persona', async () => {
            let data;
            try {
                ({ data } = await axios.get(`${this.settings.for(tenant).genesisIp}persona/${encodeURIComponent(cedula)}`));
            }
            catch {
                throw new BadGatewayException('Servicio Genesis no disponible');
            }
            if (data?.cedula_ruc)
                await this.db.query(tenant, `INSERT INTO cliente2(cedula_ruc,razon_social) VALUES (${sqlStr(data.cedula_ruc)}, ${sqlStr(data.nombre)})`);
            return data?.cedula_ruc ? 'insertada' : 'no encontrada';
        }, (r) => ({ resultadoConsulta: r }))
            .then(() => undefined);
    }
};
GasolineraService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        SybaseService,
        TenantLoggerService])
], GasolineraService);
export { GasolineraService };
//# sourceMappingURL=gasolinera.service.js.map