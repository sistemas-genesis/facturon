var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { parseXml, tipoFromXml } from '../common/sri-xml.js';
import { sqlStr } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { RideService } from '../ride/ride.service.js';
let GenesisService = class GenesisService {
    db;
    ride;
    logger;
    constructor(db, ride, logger) {
        this.db = db;
        this.ride = ride;
        this.logger = logger;
    }
    async generar(tenant, claveAcceso, accion) {
        return this.logger.audited(tenant, accion, async () => {
            const query = `SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador  FROM ce_comprobante WHERE clave_acceso = ${sqlStr(claveAcceso)}`;
            const rows = await this.db.query(tenant, query);
            if (rows.length == 0)
                throw new HttpException(`No se encontró ningún registro en ce_comprobante con clave de acceso: ${claveAcceso}`, HttpStatus.INTERNAL_SERVER_ERROR);
            const tipo = tipoFromXml(await parseXml(rows[0].ce_xml));
            if (!tipo)
                throw new HttpException('Tipo de comprobante no soportado', HttpStatus.INTERNAL_SERVER_ERROR);
            return this.ride.generate(tipo, rows[0].ce_xml, rows[0].fecha_autorizacion);
        }, (r) => ({ claveAcceso, file: r.file }), { claveAcceso });
    }
    async ride_(tenant, claveAcceso) {
        await this.generar(tenant, claveAcceso, 'genesis.ride');
    }
    async rideBlob(tenant, claveAcceso) {
        const { path } = await this.generar(tenant, claveAcceso, 'genesis.ride_blob');
        return (await readFile(path)).toString('base64');
    }
};
GenesisService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SybaseService,
        RideService,
        TenantLoggerService])
], GenesisService);
export { GenesisService };
//# sourceMappingURL=genesis.service.js.map