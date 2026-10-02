import { type AppConfig } from '../config/app-config.js';
import { PublicIpService } from '../publicip/public-ip.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
export declare class ParamsService {
    private readonly settings;
    private readonly config;
    private readonly registry;
    private readonly publicIp;
    constructor(settings: TenantSettings, config: AppConfig, registry: TenantRegistry, publicIp: PublicIpService);
    empresas(): {
        db: string;
        ruc: string;
        img: string | undefined;
        empresa: string;
        estacion: string;
        punto: string;
        avisar_desde_dia: number;
        mailsDefault: {
            mail: string;
            manual: boolean;
        } | undefined;
        publicip: string | undefined;
    }[];
    publicip(): {
        ip: string | undefined;
    };
    panelConfig(): unknown;
    private legacyDatabase;
}
