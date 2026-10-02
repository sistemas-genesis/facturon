import { z } from 'zod';
export declare const tenantSchema: z.ZodObject<{
    slug: z.ZodString;
    enabled: z.ZodDefault<z.ZodBoolean>;
    ruc: z.ZodString;
    nombreComercial: z.ZodString;
    logLevel: z.ZodOptional<z.ZodEnum<["trace", "debug", "info", "warn", "error"]>>;
    db: z.ZodObject<{
        host: z.ZodString;
        port: z.ZodNumber;
        db: z.ZodString;
        user: z.ZodString;
        pass: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        pass: string;
        db: string;
        user: string;
    }, {
        host: string;
        port: number;
        pass: string;
        db: string;
        user: string;
    }>;
    estacion: z.ZodDefault<z.ZodString>;
    punto: z.ZodDefault<z.ZodString>;
    mail: z.ZodOptional<z.ZodObject<{
        auth: z.ZodObject<{
            user: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        auth: z.ZodObject<{
            user: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        auth: z.ZodObject<{
            user: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    mailsDefault: z.ZodOptional<z.ZodObject<{
        manual: z.ZodBoolean;
        mail: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        mail: string;
        manual: boolean;
    }, {
        mail: string;
        manual: boolean;
    }>>;
    mailTask: z.ZodOptional<z.ZodObject<{
        status: z.ZodBoolean;
        frequency: z.ZodString;
        lastComprobantesDays: z.ZodNumber;
        top: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: boolean;
        frequency: string;
        lastComprobantesDays: number;
        top: number;
    }, {
        status: boolean;
        frequency: string;
        lastComprobantesDays: number;
        top: number;
    }>>;
    firma: z.ZodDefault<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        pass: z.ZodDefault<z.ZodString>;
        add: z.ZodDefault<z.ZodNumber>;
        avisar_desde_dia: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        pass: string;
        add: number;
        avisar_desde_dia: number;
    }, {
        path?: string | undefined;
        pass?: string | undefined;
        add?: number | undefined;
        avisar_desde_dia?: number | undefined;
    }>>;
    ride: z.ZodOptional<z.ZodObject<{
        optionsRIDE: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        RIDE: z.ZodOptional<z.ZodObject<{
            name: z.ZodObject<{
                codigoPrincipal: z.ZodString;
                codigoAuxiliar: z.ZodDefault<z.ZodString>;
                cantidad: z.ZodString;
                descripcion: z.ZodString;
                precioUnitario: z.ZodString;
                descuento: z.ZodString;
                precioTotal: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                codigoPrincipal: string;
                codigoAuxiliar: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
            }, {
                codigoPrincipal: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
                codigoAuxiliar?: string | undefined;
            }>;
            optionalItems: z.ZodObject<{
                detAdicional: z.ZodDefault<z.ZodObject<{
                    status: z.ZodBoolean;
                    mode: z.ZodNumber;
                    names: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    status: boolean;
                    mode: number;
                    names: string[];
                }, {
                    status: boolean;
                    mode: number;
                    names?: string[] | undefined;
                }>>;
                codigoAuxiliar: z.ZodDefault<z.ZodBoolean>;
                propina: z.ZodDefault<z.ZodObject<{
                    status: z.ZodBoolean;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    status: boolean;
                    name: string;
                }, {
                    status: boolean;
                    name: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                codigoAuxiliar: boolean;
                detAdicional: {
                    status: boolean;
                    mode: number;
                    names: string[];
                };
                propina: {
                    status: boolean;
                    name: string;
                };
            }, {
                codigoAuxiliar?: boolean | undefined;
                detAdicional?: {
                    status: boolean;
                    mode: number;
                    names?: string[] | undefined;
                } | undefined;
                propina?: {
                    status: boolean;
                    name: string;
                } | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            name: {
                codigoPrincipal: string;
                codigoAuxiliar: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
            };
            optionalItems: {
                codigoAuxiliar: boolean;
                detAdicional: {
                    status: boolean;
                    mode: number;
                    names: string[];
                };
                propina: {
                    status: boolean;
                    name: string;
                };
            };
        }, {
            name: {
                codigoPrincipal: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
                codigoAuxiliar?: string | undefined;
            };
            optionalItems: {
                codigoAuxiliar?: boolean | undefined;
                detAdicional?: {
                    status: boolean;
                    mode: number;
                    names?: string[] | undefined;
                } | undefined;
                propina?: {
                    status: boolean;
                    name: string;
                } | undefined;
            };
        }>>;
        mailTemplate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        optionsRIDE?: Record<string, unknown> | undefined;
        RIDE?: {
            name: {
                codigoPrincipal: string;
                codigoAuxiliar: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
            };
            optionalItems: {
                codigoAuxiliar: boolean;
                detAdicional: {
                    status: boolean;
                    mode: number;
                    names: string[];
                };
                propina: {
                    status: boolean;
                    name: string;
                };
            };
        } | undefined;
        mailTemplate?: string | undefined;
    }, {
        optionsRIDE?: Record<string, unknown> | undefined;
        RIDE?: {
            name: {
                codigoPrincipal: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
                codigoAuxiliar?: string | undefined;
            };
            optionalItems: {
                codigoAuxiliar?: boolean | undefined;
                detAdicional?: {
                    status: boolean;
                    mode: number;
                    names?: string[] | undefined;
                } | undefined;
                propina?: {
                    status: boolean;
                    name: string;
                } | undefined;
            };
        } | undefined;
        mailTemplate?: string | undefined;
    }>>;
    leyenda_catastro: z.ZodOptional<z.ZodObject<{
        status: z.ZodBoolean;
        key: z.ZodString;
        size: z.ZodNumber;
        breakLine: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: boolean;
        key: string;
        size: number;
        breakLine: string;
    }, {
        status: boolean;
        key: string;
        size: number;
        breakLine: string;
    }>>;
    subsidio: z.ZodDefault<z.ZodObject<{
        status: z.ZodBoolean;
        label: z.ZodOptional<z.ZodObject<{
            subsidio: z.ZodString;
            precio_sin_subsidio: z.ZodString;
            valor_total_sin_subsidio: z.ZodString;
            ahorro_subsidio: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        }, {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status: boolean;
        label?: {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        } | undefined;
    }, {
        status: boolean;
        label?: {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        } | undefined;
    }>>;
    logo: z.ZodOptional<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        width: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        width?: string | undefined;
        height?: string | undefined;
    }, {
        path?: string | undefined;
        width?: string | undefined;
        height?: string | undefined;
    }>>;
    whatsapp: z.ZodOptional<z.ZodObject<{
        phoneNumberId: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        baseUrl?: string | undefined;
        phoneNumberId?: string | undefined;
    }, {
        baseUrl?: string | undefined;
        phoneNumberId?: string | undefined;
    }>>;
    soap: z.ZodOptional<z.ZodString>;
    genesisIp: z.ZodOptional<z.ZodString>;
    facturonURL: z.ZodOptional<z.ZodString>;
    tables: z.ZodOptional<z.ZodObject<{
        file: z.ZodString;
        cabecera: z.ZodString;
        movimiento: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        file: string;
        cabecera: string;
        movimiento: string;
    }, {
        file: string;
        cabecera: string;
        movimiento: string;
    }>>;
}, "strict", z.ZodTypeAny, {
    firma: {
        path: string;
        pass: string;
        add: number;
        avisar_desde_dia: number;
    };
    slug: string;
    enabled: boolean;
    ruc: string;
    nombreComercial: string;
    db: {
        host: string;
        port: number;
        pass: string;
        db: string;
        user: string;
    };
    estacion: string;
    punto: string;
    subsidio: {
        status: boolean;
        label?: {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        } | undefined;
    };
    logLevel?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
    soap?: string | undefined;
    genesisIp?: string | undefined;
    facturonURL?: string | undefined;
    whatsapp?: {
        baseUrl?: string | undefined;
        phoneNumberId?: string | undefined;
    } | undefined;
    tables?: {
        file: string;
        cabecera: string;
        movimiento: string;
    } | undefined;
    mailTask?: {
        status: boolean;
        frequency: string;
        lastComprobantesDays: number;
        top: number;
    } | undefined;
    ride?: {
        optionsRIDE?: Record<string, unknown> | undefined;
        RIDE?: {
            name: {
                codigoPrincipal: string;
                codigoAuxiliar: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
            };
            optionalItems: {
                codigoAuxiliar: boolean;
                detAdicional: {
                    status: boolean;
                    mode: number;
                    names: string[];
                };
                propina: {
                    status: boolean;
                    name: string;
                };
            };
        } | undefined;
        mailTemplate?: string | undefined;
    } | undefined;
    mail?: z.objectOutputType<{
        auth: z.ZodObject<{
            user: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    mailsDefault?: {
        mail: string;
        manual: boolean;
    } | undefined;
    leyenda_catastro?: {
        status: boolean;
        key: string;
        size: number;
        breakLine: string;
    } | undefined;
    logo?: {
        path: string;
        width?: string | undefined;
        height?: string | undefined;
    } | undefined;
}, {
    slug: string;
    ruc: string;
    nombreComercial: string;
    db: {
        host: string;
        port: number;
        pass: string;
        db: string;
        user: string;
    };
    logLevel?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
    soap?: string | undefined;
    genesisIp?: string | undefined;
    facturonURL?: string | undefined;
    whatsapp?: {
        baseUrl?: string | undefined;
        phoneNumberId?: string | undefined;
    } | undefined;
    tables?: {
        file: string;
        cabecera: string;
        movimiento: string;
    } | undefined;
    mailTask?: {
        status: boolean;
        frequency: string;
        lastComprobantesDays: number;
        top: number;
    } | undefined;
    ride?: {
        optionsRIDE?: Record<string, unknown> | undefined;
        RIDE?: {
            name: {
                codigoPrincipal: string;
                cantidad: string;
                descripcion: string;
                precioUnitario: string;
                descuento: string;
                precioTotal: string;
                codigoAuxiliar?: string | undefined;
            };
            optionalItems: {
                codigoAuxiliar?: boolean | undefined;
                detAdicional?: {
                    status: boolean;
                    mode: number;
                    names?: string[] | undefined;
                } | undefined;
                propina?: {
                    status: boolean;
                    name: string;
                } | undefined;
            };
        } | undefined;
        mailTemplate?: string | undefined;
    } | undefined;
    firma?: {
        path?: string | undefined;
        pass?: string | undefined;
        add?: number | undefined;
        avisar_desde_dia?: number | undefined;
    } | undefined;
    enabled?: boolean | undefined;
    estacion?: string | undefined;
    punto?: string | undefined;
    mail?: z.objectInputType<{
        auth: z.ZodObject<{
            user: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            user: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    mailsDefault?: {
        mail: string;
        manual: boolean;
    } | undefined;
    leyenda_catastro?: {
        status: boolean;
        key: string;
        size: number;
        breakLine: string;
    } | undefined;
    subsidio?: {
        status: boolean;
        label?: {
            subsidio: string;
            precio_sin_subsidio: string;
            valor_total_sin_subsidio: string;
            ahorro_subsidio: string;
        } | undefined;
    } | undefined;
    logo?: {
        path?: string | undefined;
        width?: string | undefined;
        height?: string | undefined;
    } | undefined;
}>;
export type Tenant = z.infer<typeof tenantSchema>;
