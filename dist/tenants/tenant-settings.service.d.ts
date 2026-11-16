import { type AppJson, type MailTaskConfig, type RideConfig, type TablesConfig } from '../config/app-json.js';
import type { Tenant } from './tenant.types.js';
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
export declare class TenantSettings {
    private readonly json;
    constructor(json: AppJson);
    defaults(): AppJson['defaults'];
    for(t: Tenant): TenantSettingsView;
}
