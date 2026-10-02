import { Injectable, NotFoundException } from '@nestjs/common';
import moment from 'moment';
import { isset, stripAccents } from '../common/sri-xml.js';
import { sqlIdent, sqlInt, sqlNum, sqlStr } from '../database/sql.util.js';
import { Row, SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { SriClient } from './sri-client.service.js';

const fechaSql = (fechaEmision: string) =>
  moment(fechaEmision, 'DD/MM/YYYY').format('YYYY-MM-DD');
const sinComillas = (s: string) => s.replace(/["']/g, '');
type Tables = { file: string; cabecera: string; movimiento: string };
const opt = (v: unknown) => (v ? sqlStr(v) : 'NULL');

/**
 * UploaderFacturas: lleva facturas (compra o venta) autorizadas por el SRI a las tablas temporales
 * del ERP (in_cabecera_xml_temp / in_movimiento_xml_temp) de la empresa. Las rutas responden de
 * inmediato (200 vacio) y el trabajo sigue en segundo plano; el resultado queda en el log de la empresa.
 */
@Injectable()
export class UploaderService {
  constructor(
    private readonly settings: TenantSettings,
    private readonly db: SybaseService,
    private readonly sri: SriClient,
    private readonly logger: TenantLoggerService,
  ) {}

  /** Tablas temporales de ESA empresa (las suyas o las `defaults`), ya escapadas como identificador. */
  tables(tenant: Tenant) {
    const t = this.settings.for(tenant).tables;
    return {
      file: sqlIdent(t.file),
      cabecera: sqlIdent(t.cabecera),
      movimiento: sqlIdent(t.movimiento),
    };
  }

  /**
   * GET getFacturaCompra: lee el archivo de la sesion (una linea por comprobante, separado por tab:
   * ..., claveAcceso, autorizacion), actualiza su `length` y procesa las facturas (clave tipo 01).
   */
  async compra(tenant: Tenant, sesion: string): Promise<void> {
    const ses = sqlInt(sesion, 'sesion');
    const t = this.tables(tenant);
    const rows = await this.db.query<Row>(
      tenant,
      `SELECT archivo FROM ${t.file} WHERE sesion = ${ses}`,
    );
    if (!rows[0]?.archivo) throw new NotFoundException('Sesion sin archivo');
    const xmls = this.clavesDeArchivo(String(rows[0].archivo));
    await this.db.query(
      tenant,
      `UPDATE ${t.file} SET length = ${xmls.length} WHERE sesion = ${ses};commit;`,
    );
    this.background(
      tenant,
      'uploader.compra',
      { sesion: ses, facturas: xmls.length },
      async () => {
        let ok = 0;
        for (const i of xmls) {
          try {
            const r = await this.sri.comprobante(tenant, i.clave_acceso);
            await this.db.query(tenant, this.sqlCompra(r, ses, i, t));
            ok++;
          } catch (err) {
            this.logger.operation(
              tenant,
              'uploader.compra.comprobante',
              'error',
              {
                claveAcceso: i.clave_acceso,
                err: err instanceof Error ? err : new Error(String(err)),
              },
            );
          }
        }
        return { procesadas: ok };
      },
    );
  }

  /** GET getFacturaCompraIndividual: una factura de compra por clave de acceso. */
  compraIndividual(tenant: Tenant, sesion: string, claveAcceso: string) {
    const ses = sqlInt(sesion, 'sesion');
    const t = this.tables(tenant);
    this.background(
      tenant,
      'uploader.compraIndividual',
      { sesion: ses, claveAcceso },
      async () => {
        const r = await this.sri.comprobante(tenant, claveAcceso);
        await this.db.query(
          tenant,
          this.sqlCompraIndividual(r, ses, claveAcceso, t),
        );
        return {};
      },
    );
  }

  /** GET getFacturaVentaIndividual: una factura de venta (datos del comprador) por clave de acceso. */
  ventaIndividual(tenant: Tenant, sesion: string, claveAcceso: string) {
    const ses = sqlInt(sesion, 'sesion');
    const t = this.tables(tenant);
    this.background(
      tenant,
      'uploader.ventaIndividual',
      { sesion: ses, claveAcceso },
      async () => {
        const r = await this.sri.comprobante(tenant, claveAcceso);
        await this.db.query(
          tenant,
          this.sqlVentaIndividual(r, ses, claveAcceso, t),
        );
        return {};
      },
    );
  }

  /** Lineas de archivo -> [{clave_acceso, autorizacion}] solo facturas (posicion 8-9 de la clave = 01). */
  clavesDeArchivo(contenido: string) {
    const claves: { clave_acceso: string; autorizacion: string }[] = [];
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

  // ---- construccion de SQL (puro, probado en uploader.service.spec.ts) ----

  sqlCompra(
    r: Record<string, any>,
    sesion: string,
    i: { clave_acceso: string; autorizacion: string },
    t: Tables,
  ): string {
    const it = r.factura.infoTributaria[0];
    const inf = r.factura.infoFactura[0];
    const d = r.factura.detalles[0].detalle;
    const nombreComercial = it.nombreComercial
      ? sqlStr(stripAccents(it.nombreComercial[0]))
      : 'NULL';
    const razonSocial = stripAccents(it.razonSocial[0]);
    const dirMatriz = stripAccents(it.dirMatriz[0]);
    let q =
      `INSERT INTO ${t.cabecera}` +
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

  sqlCompraIndividual(
    r: Record<string, any>,
    sesion: string,
    claveParam: string,
    t: Tables,
  ): string {
    const it = r.factura.infoTributaria[0];
    const inf = r.factura.infoFactura[0];
    const d = r.factura.detalles[0].detalle;
    const nombreComercial = it.nombreComercial
      ? sqlStr(stripAccents(it.nombreComercial[0]))
      : 'NULL';
    const razonSocial = stripAccents(it.razonSocial[0]);
    const dirMatriz = stripAccents(it.dirMatriz[0]);
    const clave = it.claveAcceso[0];

    // Descuento adicional: nodo totalConImpuestos + cada impuesto de cada detalle
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
    const cab =
      `INSERT INTO ${t.cabecera}` +
      `(sesion, clave_acceso, fecha_autoriza, razon_social, nombre_comercial, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion, descuento_adicional) VALUES` +
      `(${sesion}, ${sqlStr(clave)}, ${sqlStr(fechaSql(inf.fechaEmision[0]))}, ${sqlStr(razonSocial)}, ${nombreComercial}, ${sqlStr(dirMatriz)}, ${sqlStr(it.ruc[0])}, ${sqlStr(it.estab[0])}, ${sqlStr(it.ptoEmi[0])}, ${sqlStr(it.secuencial[0])}, ${sqlStr(claveParam)}, ${sqlNum(descuentoAdicional)});`;
    return cab + movs;
  }

  sqlVentaIndividual(
    r: Record<string, any>,
    sesion: string,
    claveParam: string,
    t: Tables,
  ): string {
    const it = r.factura.infoTributaria[0];
    const inf = r.factura.infoFactura[0];
    const d = r.factura.detalles[0].detalle;
    const direccion = inf.direccionComprador
      ? sqlStr(stripAccents(inf.direccionComprador[0]))
      : 'NULL';
    const razon = stripAccents(inf.razonSocialComprador[0]);
    const clave = it.claveAcceso[0];
    let q =
      `INSERT INTO ${t.cabecera}` +
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

  private sumaImpuestos(j: Record<string, any>): string {
    let impuesto = 0;
    for (const k of j.impuestos[0].impuesto) impuesto += parseFloat(k.valor[0]);
    return sqlNum(impuesto);
  }

  /** Segundo plano: nunca lanza; deja el resultado en el log de la empresa. */
  private background(
    tenant: Tenant,
    accion: string,
    meta: Record<string, unknown>,
    fn: () => Promise<Record<string, unknown>>,
  ) {
    void this.logger
      .audited(tenant, accion, fn, (r) => r, meta)
      .catch(() => undefined);
  }
}
