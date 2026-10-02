import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { parseXml, tipoFromXml } from '../common/sri-xml.js';
import { sqlStr } from '../database/sql.util.js';
import { Row, SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { RideService } from '../ride/ride.service.js';
import type { Tenant } from '../tenants/tenant.types.js';

@Injectable()
export class GenesisService {
  constructor(
    private readonly db: SybaseService,
    private readonly ride: RideService,
    private readonly logger: TenantLoggerService,
  ) {}

  /** Genera el PDF del comprobante con esa clave de acceso y devuelve su ruta en disco. */
  private async generar(tenant: Tenant, claveAcceso: string, accion: string) {
    return this.logger.audited(
      tenant,
      accion,
      async () => {
        const query = `SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador  FROM ce_comprobante WHERE clave_acceso = ${sqlStr(claveAcceso)}`;
        const rows = await this.db.query<Row>(tenant, query);
        if (rows.length == 0)
          throw new HttpException(
            `No se encontró ningún registro en ce_comprobante con clave de acceso: ${claveAcceso}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        const tipo = tipoFromXml(await parseXml(rows[0].ce_xml));
        if (!tipo)
          throw new HttpException(
            'Tipo de comprobante no soportado',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        return this.ride.generate(
          tipo,
          rows[0].ce_xml,
          rows[0].fecha_autorizacion,
        );
      },
      (r) => ({ claveAcceso, file: r.file }),
      { claveAcceso },
    );
  }

  /** GET /api/genesis/ride: genera el PDF (queda disponible en /api/pdf/<clave>.pdf). */
  async ride_(tenant: Tenant, claveAcceso: string): Promise<void> {
    await this.generar(tenant, claveAcceso, 'genesis.ride');
  }

  /** GET /api/genesis/ride_blob: genera el PDF y lo devuelve en base64. */
  async rideBlob(tenant: Tenant, claveAcceso: string): Promise<string> {
    const { path } = await this.generar(
      tenant,
      claveAcceso,
      'genesis.ride_blob',
    );
    return (await readFile(path)).toString('base64');
  }
}
