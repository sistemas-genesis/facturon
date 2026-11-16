export type RideTipo = 'factura' | 'retencion' | 'retencion2' | 'credito' | 'debito' | 'remision' | 'liquidacion';
export declare function tipoFromXml(result: Record<string, any>): RideTipo | '';
export declare function parseXml(xml: string): Promise<Record<string, any>>;
export declare function getValorFromXml(json: Record<string, any>): string | number;
export declare function getMailFromXml(node: Record<string, any>): string | false;
export declare function stripAccents(s: string): string;
export declare function isset(obj: unknown): boolean;
