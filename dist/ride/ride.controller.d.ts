import { RideXmlDto } from './dto.js';
import { RideService } from './ride.service.js';
export declare class RideController {
    private readonly ride;
    constructor(ride: RideService);
    private render;
    factura(f: string, b: RideXmlDto): Promise<string>;
    retencion(f: string, b: RideXmlDto): Promise<string>;
    credito(f: string, b: RideXmlDto): Promise<string>;
    debito(f: string, b: RideXmlDto): Promise<string>;
    remision(f: string, b: RideXmlDto): Promise<string>;
    liquidacion(f: string, b: RideXmlDto): Promise<string>;
    retencion2(f: string, b: RideXmlDto): Promise<string>;
}
