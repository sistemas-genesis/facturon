import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
export interface FirmaInfo {
    enddate: string;
    diff: number;
    startdate: string;
    subject: string;
    rest: string;
}
export declare class FirmaService {
    private readonly registry;
    private readonly logger;
    constructor(registry: TenantRegistry, logger: TenantLoggerService);
    diasParaCaducar(ruc: string): Promise<string | undefined>;
    info(firma: string, pass: string): Promise<{
        success: true;
        data: FirmaInfo;
    } | {
        success: false;
        msg: string;
    }>;
}
