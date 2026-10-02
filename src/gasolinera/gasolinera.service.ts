import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { sqlStr } from '../database/sql.util.js';
import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';

/** Genesis Gasolinera API REST: alta de clientes consultando el servicio central Genesis. */
@Injectable()
export class GasolineraService {
  constructor(
    private readonly settings: TenantSettings,
    private readonly db: SybaseService,
    private readonly logger: TenantLoggerService,
  ) {}

  /** Consulta la persona en Genesis y, si existe, la inserta en cliente2 de la empresa. */
  persona(tenant: Tenant, cedula: string): Promise<void> {
    return this.logger
      .audited(
        tenant,
        'gasolinera.persona',
        async () => {
          let data: { cedula_ruc?: string; nombre?: string };
          try {
            ({ data } = await axios.get(
              `${this.settings.for(tenant).genesisIp}persona/${encodeURIComponent(cedula)}`,
            ));
          } catch {
            throw new BadGatewayException('Servicio Genesis no disponible');
          }
          if (data?.cedula_ruc)
            await this.db.query(
              tenant,
              `INSERT INTO cliente2(cedula_ruc,razon_social) VALUES (${sqlStr(data.cedula_ruc)}, ${sqlStr(data.nombre)})`,
            );
          return data?.cedula_ruc ? 'insertada' : 'no encontrada';
        },
        (r) => ({ resultadoConsulta: r }),
      )
      .then(() => undefined);
  }
}
