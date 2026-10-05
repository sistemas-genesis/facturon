import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { PublicIpService } from '../publicip/public-ip.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';

const MASK = '********';

@Injectable()
export class ParamsService {
  constructor(
    private readonly settings: TenantSettings,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly registry: TenantRegistry,
    private readonly publicIp: PublicIpService,
  ) {}

  /** GET /api/params/empresas: lo que necesita el front para armar los filtros (sin credenciales). */
  empresas() {
    return this.registry
      .list()
      .filter((t) => t.enabled)
      .map((t) => ({
        db: t.db.db,
        ruc: t.ruc,
        img: t.logo?.path,
        empresa: t.nombreComercial,
        estacion: t.estacion,
        punto: t.punto,
        mailsDefault: t.mailsDefault,
        publicip: this.publicIp.ip,
      }));
  }

  publicip() {
    return { ip: this.publicIp.ip };
  }

  /**
   * GET /api/params/config: configuracion por empresa (misma forma que el params.js legacy, que
   * consume /config). Es solo lectura y las contrasenas SIEMPRE salen enmascaradas.
   */
  panelConfig(): unknown {
    const d = this.settings.defaults();
    return {
      host: this.config.host,
      port: this.config.port,
      // valores por defecto que toda empresa hereda (config/app.config.json -> defaults)
      soap: d.soap,
      genesisIp: d.genesisIp,
      tables: d.tables,
      facturonURL: d.facturonURL,
      mailTask: d.mailTask,
      databases: this.registry.list().map((t) => this.legacyDatabase(t)),
    };
  }

  private legacyDatabase(t: Tenant) {
    const hide = (v: string | undefined) => (v ? MASK : v);
    return {
      slug: t.slug,
      enabled: t.enabled,
      user: t.db.user,
      pass: hide(t.db.pass),
      port: String(t.db.port),
      db: t.db.db,
      host: t.db.host,
      ruc: t.ruc,
      img: t.logo?.path,
      imgWidth: t.logo?.width,
      imgHeight: t.logo?.height,
      nombreComercial: t.nombreComercial,
      mail: t.mail && {
        ...t.mail,
        auth: {
          ...t.mail.auth,
          ...(typeof t.mail.auth.pass === 'string' && {
            pass: hide(t.mail.auth.pass as string),
          }),
          ...(typeof t.mail.auth.clientSecret === 'string' && {
            clientSecret: hide(t.mail.auth.clientSecret as string),
          }),
          ...(typeof t.mail.auth.refreshToken === 'string' && {
            refreshToken: hide(t.mail.auth.refreshToken as string),
          }),
        },
      },
      mailsDefault: t.mailsDefault,
      estacion: t.estacion,
      punto: t.punto,
      leyenda_catastro: t.leyenda_catastro,
      subsidio: t.subsidio,
      phoneNumerId: t.whatsapp?.phoneNumberId,
      // sobrescrituras propias de la empresa (si no, rigen los defaults del nivel superior)
      overrides: {
        soap: t.soap,
        genesisIp: t.genesisIp,
        facturonURL: t.facturonURL,
        tables: t.tables,
        whatsappBaseUrl: t.whatsapp?.baseUrl,
        mailTask: t.mailTask,
      },
    };
  }
}
