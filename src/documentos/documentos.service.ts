import { Injectable } from '@nestjs/common';
import { LegacyError } from '../common/legacy-error.js';
import { sqlInt, sqlStr } from '../database/sql.util.js';
import { Row, SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import type { BusquedaDocumentosDto } from './dto.js';

/** Condiciones comunes de empresa/estacion/punto/tipo (las mismas del legacy). */
function filtros(b: BusquedaDocumentosDto): string {
  const empresas = sqlStr(b.empresas);
  const estacion = sqlStr(b.estacion);
  const punto = sqlStr(b.punto);
  const tipos = sqlStr(b.tipos);
  return (
    `  AND ${empresas} LIKE '%'+ruc_emisor+'%' ` +
    `  AND (${estacion} LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = ${estacion}) ` +
    `  AND (${punto} LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ',' = ${punto}) ` +
    `  AND ${tipos} LIKE '%,'+tipo_comprobante+',%'`
  );
}

const COLUMNAS =
  'SELECT ce_id, ruc_emisor, ruc_comprador, ' +
  'nombre_comprador = web_clear_special(nombre_comprador), ' +
  'fecha_comprobante, numero_comprobante, clave_acceso, ' +
  'numero_autorizacion, fecha_autorizacion, tipo_comprobante ' +
  'FROM ce_comprobante ';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly db: SybaseService,
    private readonly logger: TenantLoggerService,
  ) {}

  private campoFecha(b: BusquedaDocumentosDto): string {
    return b.params?.fecha_autorizacion
      ? 'fecha_autorizacion'
      : 'fecha_comprobante';
  }

  /** Comprobantes autorizados (estado 4) de un comprador entre dos fechas. */
  buscarPorComprador(
    tenant: Tenant,
    cedulaRuc: string,
    start: string,
    end: string,
    b: BusquedaDocumentosDto,
  ): Promise<Row[]> {
    const fecha = this.campoFecha(b);
    const ced = sqlStr(cedulaRuc);
    const query =
      COLUMNAS +
      `WHERE (ruc_comprador = ${ced} ` +
      `   OR ruc_comprador = SUBSTR(${ced},0,11) ` +
      `   OR ruc_comprador = ${ced} + '001') ` +
      `  AND estado = 4 ` +
      `  AND DATE(${fecha}) >= ${sqlStr(start)} ` +
      `  AND DATE(${fecha}) <= ${sqlStr(end)} ` +
      `  AND ruc_comprador <> '9999999999999' ` +
      filtros(b);
    return this.logger.audited(
      tenant,
      'documentos.buscar',
      () => this.db.query(tenant, query),
      (rows) => ({ filas: rows.length, desde: start, hasta: end }),
    );
  }

  /** Todos los comprobantes del rango, sin filtrar por comprador. */
  buscarTodos(
    tenant: Tenant,
    start: string,
    end: string,
    b: BusquedaDocumentosDto,
  ): Promise<Row[]> {
    const fecha = this.campoFecha(b);
    const query =
      COLUMNAS +
      `WHERE DATE(${fecha}) >= ${sqlStr(start)} ` +
      ` AND DATE(${fecha}) <= ${sqlStr(end)} ` +
      filtros(b);
    return this.logger.audited(
      tenant,
      'documentos.buscarTodos',
      () => this.db.query(tenant, query),
      (rows) => ({ filas: rows.length, desde: start, hasta: end }),
    );
  }

  /** XML guardado del comprobante, saneado para que el navegador pueda parsearlo. */
  async xmlPorId(tenant: Tenant, id: string): Promise<string> {
    const query = `SELECT TOP 1 ce_xml FROM ce_comprobante WHERE ce_id = ${sqlInt(id, 'id')}`;
    let rows: Row[];
    try {
      rows = await this.logger.audited(
        tenant,
        'documentos.xmlPorId',
        () => this.db.query(tenant, query),
        (r) => ({ ceId: id, encontrado: !!r?.[0]?.ce_xml }),
      );
    } catch {
      throw new LegacyError(500, 'Error consultando el XML');
    }
    if (!rows || !rows[0] || !rows[0].ce_xml)
      throw new LegacyError(404, 'XML no disponible');
    let xml: string = rows[0].ce_xml;
    xml = xml.replace(/\0/g, '');
    // eslint-disable-next-line no-control-regex
    xml = xml.replace(/[\u0000-\u001F\u007F]/g, '');
    xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
    return xml;
  }
}
