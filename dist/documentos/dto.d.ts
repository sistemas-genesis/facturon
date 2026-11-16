declare class BusquedaParamsDto {
    fecha_autorizacion?: boolean;
}
export declare class BusquedaDocumentosDto {
    empresas: string;
    estacion: string;
    punto: string;
    tipos: string;
    params?: BusquedaParamsDto;
}
export {};
