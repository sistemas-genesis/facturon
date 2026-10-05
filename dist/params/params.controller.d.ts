import { ParamsService } from './params.service.js';
export declare class ParamsController {
    private readonly params;
    constructor(params: ParamsService);
    empresas(): {
        db: string;
        ruc: string;
        img: string | undefined;
        empresa: string;
        estacion: string;
        punto: string;
        mailsDefault: {
            mail: string;
            manual: boolean;
        } | undefined;
        publicip: string | undefined;
    }[];
    config(): unknown;
    publicip(): {
        ip: string | undefined;
    };
}
