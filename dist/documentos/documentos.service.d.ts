import { Row, SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import type { BusquedaDocumentosDto } from './dto.js';
export declare class DocumentosService {
    private readonly db;
    private readonly logger;
    constructor(db: SybaseService, logger: TenantLoggerService);
    private campoFecha;
    buscarPorComprador(tenant: Tenant, cedulaRuc: string, start: string, end: string, b: BusquedaDocumentosDto): Promise<Row[]>;
    buscarTodos(tenant: Tenant, start: string, end: string, b: BusquedaDocumentosDto): Promise<Row[]>;
    xmlPorId(tenant: Tenant, id: string): Promise<string>;
}
