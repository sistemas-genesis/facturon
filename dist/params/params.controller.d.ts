import { ParamsService } from './params.service.js';
export declare class ParamsController {
    private readonly params;
    constructor(params: ParamsService);
    empresas(): {
        slug: any;
        db: any;
        host: any;
        ruc: any;
        img: any;
        empresa: any;
        estacion: any;
        punto: any;
        mailsDefault: any;
        publicip: string | undefined;
    }[];
    config(): unknown;
    publicip(): {
        ip: string | undefined;
    };
}
