import { Inject, Injectable } from '@nestjs/common';
import {
  APP_JSON,
  type AppJson,
  type MailTaskConfig,
  type RideConfig,
  type TablesConfig,
} from '../config/app-json.js';
import type { Tenant } from './tenant.types.js';

/** Configuracion efectiva de una empresa: lo suyo si lo define, si no el `defaults` global. */
export interface TenantSettingsView {
  soap: string;
  genesisIp: string;
  facturonURL: string;
  whatsappBaseUrl: string;
  tables: TablesConfig;
  mailTask: MailTaskConfig;
  RIDE: RideConfig;
  mailTemplate: string;
  sri: AppJson['defaults']['sri'];
}

/**
 * Unico lugar donde se mezclan los `defaults` globales con el JSON de la empresa.
 * Siempre se resuelve a partir de la empresa del request/RUC, nunca de otra.
 */
@Injectable()
export class TenantSettings {
  constructor(@Inject(APP_JSON) private readonly json: AppJson) {}

  /** Valores globales por defecto (lo que hereda una empresa que no los define). */
  defaults(): AppJson['defaults'] {
    return this.json.defaults;
  }

  for(t: Tenant): TenantSettingsView {
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
}
