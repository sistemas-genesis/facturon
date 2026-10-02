var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import moment from 'moment';
import { isset, stripAccents } from '../common/sri-xml.js';
import { sqlIdent, sqlInt, sqlNum, sqlStr } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import { SriClient } from './sri-client.service.js';
const fechaSql = (fechaEmision) => moment(fechaEmision, 'DD/MM/YYYY').format('YYYY-MM-DD');
const sinComillas = (s) => s.replace(/["']/g, '');
const opt = (v) => (v ? sqlStr(v) : 'NULL');
let UploaderService = class UploaderService {
    settings;
    db;
    sri;
    logger;
    constructor(settings, db, sri, logger) {
        this.settings = settings;
        this.db = db;
        this.sri = sri;
        this.logger = logger;
    }
    tables(tenant) {
        const t = this.settings.for(tenant).tables;
        return {
            file: sqlIdent(t.file),
            cabecera: sqlIdent(t.cabecera),
            movimiento: sqlIdent(t.movimiento),
        };
    }
    async compra(tenant, sesion) {
        const ses = sqlInt(sesion, 'sesion');
        const t = this.tables(tenant);
        const rows = await this.db.query(tenant, `SELECT archivo FROM ${t.file} WHERE sesion = ${ses}`);
        if (!rows[0]?.archivo)
            throw new NotFoundException('Sesion sin archivo');
        const xmls = this.clavesDeArchivo(String(rows[0].archivo));
        await this.db.query(tenant, `UPDATE ${t.file} SET length = ${xmls.length} WHERE sesion = ${ses};commit;`);
        this.background(tenant, 'uploader.compra', { sesion: ses, facturas: xmls.length }, async () => {
            let ok = 0;
            for (const i of xmls) {
                try {
                    const r = await this.sri.comprobante(tenant, i.clave_acceso);
                    await this.db.query(tenant, this.sqlCompra(r, ses, i, t));
                    ok++;
                }
                catch (err) {
                    this.logger.operation(tenant, 'uploader.compra.comprobante', 'error', {
                        claveAcceso: i.clave_acceso,
                        err: err instanceof Error ? err : new Error(String(err)),
                    });
                }
            }
            return { procesadas: ok };
        });
    }
    compraIndividual(tenant, sesion, claveAcceso) {
        const ses = sqlInt(sesion, 'sesion');
        const t = this.tables(tenant);
        this.background(tenant, 'uploader.compraIndividual', { sesion: ses, claveAcceso }, async () => {
            const r = await this.sri.comprobante(tenant, claveAcceso);
            await this.db.query(tenant, this.sqlCompraIndividual(r, ses, claveAcceso, t));
            return {};
        });
    }
    ventaIndividual(tenant, sesion, claveAcceso) {
        const ses = sqlInt(sesion, 'sesion');
        const t = this.tables(tenant);
        this.background(tenant, 'uploader.ventaIndividual', { sesion: ses, claveAcceso }, async () => {
            const r = await this.sri.comprobante(tenant, claveAcceso);
            await this.db.query(tenant, this.sqlVentaIndividual(r, ses, claveAcceso, t));
            return {};
        });
    }
    clavesDeArchivo(contenido) {
        const claves = [];
        for (const line of contenido.split(/\r?\n/)) {
            const aux = line.split('\t');
            const last = aux[aux.length - 1];
            if (last.length == 49 || last.length == 37) {
                const clave = aux[aux.length - 2] ?? '';
                if (clave.substr(8, 2) == '01')
                    claves.push({ clave_acceso: clave, autorizacion: last });
            }
        }
        return claves;
    }
    sqlCompra(r, sesion, i, t) {
        const it = r.factura.infoTributaria[0];
        const inf = r.factura.infoFactura[0];
        const d = r.factura.detalles[0].detalle;
        const nombreComercial = it.nombreComercial
            ? sqlStr(stripAccents(it.nombreComercial[0]))
            : 'NULL';
        const razonSocial = stripAccents(it.razonSocial[0]);
        const dirMatriz = stripAccents(it.dirMatriz[0]);
        let q = `INSERT INTO ${t.cabecera}` +
            `(sesion, clave_acceso, fecha_autoriza, razon_social, nombre_comercial, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion) VALUES` +
            `(${sesion}, ${sqlStr(i.clave_acceso)}, ${sqlStr(fechaSql(inf.fechaEmision[0]))}, ${sqlStr(razonSocial)}, ${nombreComercial}, ${sqlStr(dirMatriz)}, ${sqlStr(it.ruc[0])}, ${sqlStr(it.estab[0])}, ${sqlStr(it.ptoEmi[0])}, ${sqlStr(it.secuencial[0])}, ${sqlStr(i.autorizacion)});`;
        for (const j of d) {
            const impuesto = this.sumaImpuestos(j);
            q +=
                `INSERT INTO ${t.movimiento}` +
                    ` (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto) VALUES ` +
                    `(${sesion}, ${sqlStr(i.clave_acceso)}, ${sqlStr(j.codigoPrincipal[0])}, ${opt(j.codigoAuxiliar?.[0])}, ${sqlNum(j.cantidad[0])}, ${sqlNum(j.precioUnitario[0])}, ${sqlNum(j.descuento[0])}, ${sqlNum(j.precioTotalSinImpuesto[0])}, ${sqlStr(stripAccents(j.descripcion[0]))},  ${impuesto});`;
        }
        return q;
    }
    sqlCompraIndividual(r, sesion, claveParam, t) {
        const it = r.factura.infoTributaria[0];
        const inf = r.factura.infoFactura[0];
        const d = r.factura.detalles[0].detalle;
        const nombreComercial = it.nombreComercial
            ? sqlStr(stripAccents(it.nombreComercial[0]))
            : 'NULL';
        const razonSocial = stripAccents(it.razonSocial[0]);
        const dirMatriz = stripAccents(it.dirMatriz[0]);
        const clave = it.claveAcceso[0];
        let descuentoAdicional = 0;
        for (const k of inf.totalConImpuestos?.[0]?.totalImpuesto ?? [])
            descuentoAdicional += k.descuentoAdicional
                ? parseFloat(k.descuentoAdicional[0]) || 0
                : 0;
        let movs = '';
        for (const j of d) {
            let impuesto = 0;
            for (const k of j.impuestos[0].impuesto) {
                impuesto += parseFloat(k.valor[0]);
                descuentoAdicional += k.descuentoAdicional
                    ? parseFloat(k.descuentoAdicional[0]) || 0
                    : 0;
            }
            let detadicional = '';
            for (const k of j.detallesAdicionales?.[0]?.detAdicional ?? [])
                detadicional += k['$'].nombre + ' = ' + k['$'].valor;
            detadicional = detadicional.replace(/["']/g, '"');
            const codigoPrincipal = isset(j.codigoPrincipal)
                ? j.codigoPrincipal[0]
                : '';
            movs +=
                `INSERT INTO ${t.movimiento}` +
                    ` (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto, detadicional) VALUES ` +
                    `(${sesion}, ${sqlStr(clave)}, ${sqlStr(codigoPrincipal)}, ${opt(j.codigoAuxiliar?.[0])}, ${sqlNum(j.cantidad[0])}, ${sqlNum(j.precioUnitario[0])}, ${sqlNum(j.descuento[0])}, ${sqlNum(j.precioTotalSinImpuesto[0])}, ${sqlStr(sinComillas(stripAccents(j.descripcion[0])))},  ${sqlNum(impuesto)}, ${sqlStr(detadicional)});`;
        }
        const cab = `INSERT INTO ${t.cabecera}` +
            `(sesion, clave_acceso, fecha_autoriza, razon_social, nombre_comercial, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion, descuento_adicional) VALUES` +
            `(${sesion}, ${sqlStr(clave)}, ${sqlStr(fechaSql(inf.fechaEmision[0]))}, ${sqlStr(razonSocial)}, ${nombreComercial}, ${sqlStr(dirMatriz)}, ${sqlStr(it.ruc[0])}, ${sqlStr(it.estab[0])}, ${sqlStr(it.ptoEmi[0])}, ${sqlStr(it.secuencial[0])}, ${sqlStr(claveParam)}, ${sqlNum(descuentoAdicional)});`;
        return cab + movs;
    }
    sqlVentaIndividual(r, sesion, claveParam, t) {
        const it = r.factura.infoTributaria[0];
        const inf = r.factura.infoFactura[0];
        const d = r.factura.detalles[0].detalle;
        const direccion = inf.direccionComprador
            ? sqlStr(stripAccents(inf.direccionComprador[0]))
            : 'NULL';
        const razon = stripAccents(inf.razonSocialComprador[0]);
        const clave = it.claveAcceso[0];
        let q = `INSERT INTO ${t.cabecera}` +
            `(sesion, clave_acceso, fecha_autoriza, razon_social, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion) VALUES` +
            `(${sesion}, ${sqlStr(clave)}, ${sqlStr(fechaSql(inf.fechaEmision[0]))}, ${sqlStr(razon)}, ${direccion}, ${sqlStr(inf.identificacionComprador[0])}, ${sqlStr(it.estab[0])}, ${sqlStr(it.ptoEmi[0])}, ${sqlStr(it.secuencial[0])}, ${sqlStr(claveParam)});`;
        for (const j of d) {
            const codigoPrincipal = isset(j.codigoPrincipal)
                ? j.codigoPrincipal[0]
                : '';
            q +=
                `INSERT INTO ${t.movimiento}` +
                    ` (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto) VALUES ` +
                    `(${sesion}, ${sqlStr(clave)}, ${sqlStr(codigoPrincipal)}, ${opt(j.codigoAuxiliar?.[0])}, ${sqlNum(j.cantidad[0])}, ${sqlNum(j.precioUnitario[0])}, ${sqlNum(j.descuento[0])}, ${sqlNum(j.precioTotalSinImpuesto[0])}, ${sqlStr(sinComillas(stripAccents(j.descripcion[0])))},  ${this.sumaImpuestos(j)});`;
        }
        return q;
    }
    sumaImpuestos(j) {
        let impuesto = 0;
        for (const k of j.impuestos[0].impuesto)
            impuesto += parseFloat(k.valor[0]);
        return sqlNum(impuesto);
    }
    background(tenant, accion, meta, fn) {
        void this.logger
            .audited(tenant, accion, fn, (r) => r, meta)
            .catch(() => undefined);
    }
};
UploaderService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings,
        SybaseService,
        SriClient,
        TenantLoggerService])
], UploaderService);
export { UploaderService };
//# sourceMappingURL=uploader.service.js.map