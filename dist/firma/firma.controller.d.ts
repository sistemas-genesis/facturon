import { FirmaInfoDto } from './dto.js';
import { FirmaService } from './firma.service.js';
export declare class FirmaController {
    private readonly firma;
    constructor(firma: FirmaService);
    fechaCaducidad(ruc: string): Promise<string | undefined>;
    info(body: FirmaInfoDto): Promise<{
        success: true;
        data: import("./firma.service.js").FirmaInfo;
    } | {
        success: false;
        msg: string;
    }>;
}
