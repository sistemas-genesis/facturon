import type { Tenant } from '../tenants/tenant.types.js';
import { UploaderService } from './uploader.service.js';
export declare class UploaderController {
    private readonly uploader;
    constructor(uploader: UploaderService);
    compra(t: Tenant, sesion: string): Promise<void>;
    compraIndividual(t: Tenant, sesion: string, clave: string): void;
    ventaIndividual(t: Tenant, sesion: string, clave: string): void;
}
