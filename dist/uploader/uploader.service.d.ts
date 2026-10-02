import { SybaseService } from '../database/sybase.service.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { SriClient } from './sri-client.service.js';
type Tables = {
    file: string;
    cabecera: string;
    movimiento: string;
};
export declare class UploaderService {
    private readonly settings;
    private readonly db;
    private readonly sri;
    private readonly logger;
    constructor(settings: TenantSettings, db: SybaseService, sri: SriClient, logger: TenantLoggerService);
    tables(tenant: Tenant): {
        file: string;
        cabecera: string;
        movimiento: string;
    };
    compra(tenant: Tenant, sesion: string): Promise<void>;
    compraIndividual(tenant: Tenant, sesion: string, claveAcceso: string): void;
    ventaIndividual(tenant: Tenant, sesion: string, claveAcceso: string): void;
    clavesDeArchivo(contenido: string): {
        clave_acceso: string;
        autorizacion: string;
    }[];
    sqlCompra(r: Record<string, any>, sesion: string, i: {
        clave_acceso: string;
        autorizacion: string;
    }, t: Tables): string;
    sqlCompraIndividual(r: Record<string, any>, sesion: string, claveParam: string, t: Tables): string;
    sqlVentaIndividual(r: Record<string, any>, sesion: string, claveParam: string, t: Tables): string;
    private sumaImpuestos;
    private background;
}
export {};
