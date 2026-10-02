import type { Tenant } from '../tenants/tenant.types.js';
import { BusquedaDocumentosDto } from './dto.js';
import { DocumentosService } from './documentos.service.js';
export declare class DocumentosController {
    private readonly documentos;
    constructor(documentos: DocumentosService);
    get(tenant: Tenant, cedulaRuc: string, start: string, end: string, body: BusquedaDocumentosDto): Promise<import("../database/sybase.service.js").Row[]>;
    getLike(tenant: Tenant, start: string, end: string, body: BusquedaDocumentosDto): Promise<import("../database/sybase.service.js").Row[]>;
    getXmlById(tenant: Tenant, id: string): Promise<string>;
}
