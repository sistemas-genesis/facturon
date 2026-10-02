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
import { LegacyError } from '../common/legacy-error.js';
import { sqlInt, sqlStr } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
function filtros(b) {
    const empresas = sqlStr(b.empresas);
    const estacion = sqlStr(b.estacion);
    const punto = sqlStr(b.punto);
    const tipos = sqlStr(b.tipos);
    return (`  AND ${empresas} LIKE '%'+ruc_emisor+'%' ` +
        `  AND (${estacion} LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = ${estacion}) ` +
        `  AND (${punto} LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ',' = ${punto}) ` +
        `  AND ${tipos} LIKE '%,'+tipo_comprobante+',%'`);
}
const COLUMNAS = 'SELECT ce_id, ruc_emisor, ruc_comprador, ' +
    'nombre_comprador = web_clear_special(nombre_comprador), ' +
    'fecha_comprobante, numero_comprobante, clave_acceso, ' +
    'numero_autorizacion, fecha_autorizacion, tipo_comprobante ' +
    'FROM ce_comprobante ';
let DocumentosService = class DocumentosService {
    db;
    logger;
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }
    campoFecha(b) {
        return b.params?.fecha_autorizacion
            ? 'fecha_autorizacion'
            : 'fecha_comprobante';
    }
    buscarPorComprador(tenant, cedulaRuc, start, end, b) {
        const fecha = this.campoFecha(b);
        const ced = sqlStr(cedulaRuc);
        const query = COLUMNAS +
            `WHERE (ruc_comprador = ${ced} ` +
            `   OR ruc_comprador = SUBSTR(${ced},0,11) ` +
            `   OR ruc_comprador = ${ced} + '001') ` +
            `  AND estado = 4 ` +
            `  AND DATE(${fecha}) >= ${sqlStr(start)} ` +
            `  AND DATE(${fecha}) <= ${sqlStr(end)} ` +
            `  AND ruc_comprador <> '9999999999999' ` +
            filtros(b);
        return this.logger.audited(tenant, 'documentos.buscar', () => this.db.query(tenant, query), (rows) => ({ filas: rows.length, desde: start, hasta: end }));
    }
    buscarTodos(tenant, start, end, b) {
        const fecha = this.campoFecha(b);
        const query = COLUMNAS +
            `WHERE DATE(${fecha}) >= ${sqlStr(start)} ` +
            ` AND DATE(${fecha}) <= ${sqlStr(end)} ` +
            filtros(b);
        return this.logger.audited(tenant, 'documentos.buscarTodos', () => this.db.query(tenant, query), (rows) => ({ filas: rows.length, desde: start, hasta: end }));
    }
    async xmlPorId(tenant, id) {
        const query = `SELECT TOP 1 ce_xml FROM ce_comprobante WHERE ce_id = ${sqlInt(id, 'id')}`;
        let rows;
        try {
            rows = await this.logger.audited(tenant, 'documentos.xmlPorId', () => this.db.query(tenant, query), (r) => ({ ceId: id, encontrado: !!r?.[0]?.ce_xml }));
        }
        catch {
            throw new LegacyError(500, 'Error consultando el XML');
        }
        if (!rows || !rows[0] || !rows[0].ce_xml)
            throw new LegacyError(404, 'XML no disponible');
        let xml = rows[0].ce_xml;
        xml = xml.replace(/\0/g, '');
        xml = xml.replace(/[\u0000-\u001F\u007F]/g, '');
        xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
        return xml;
    }
};
DocumentosService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SybaseService,
        TenantLoggerService])
], DocumentosService);
export { DocumentosService };
//# sourceMappingURL=documentos.service.js.map