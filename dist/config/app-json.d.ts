import { z } from 'zod';
export declare const APP_JSON: unique symbol;
export declare const rideSchema: z.ZodObject<{
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
}>;
export type RideConfig = z.infer<typeof rideSchema>;
export declare const mailTaskSchema: z.ZodObject<{
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
}>;
export type MailTaskConfig = z.infer<typeof mailTaskSchema>;
export declare const tablesSchema: z.ZodObject<{
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
}>;
export type TablesConfig = z.infer<typeof tablesSchema>;
export declare const appJsonSchema: z.ZodObject<{
    server: z.ZodDefault<z.ZodObject<{
        host: z.ZodDefault<z.ZodString>;
        port: z.ZodDefault<z.ZodNumber>;
        tenantsDir: z.ZodDefault<z.ZodString>;
        logsDir: z.ZodDefault<z.ZodString>;
        logLevel: z.ZodDefault<z.ZodEnum<["trace", "debug", "info", "warn", "error"]>>;
        logRetentionDays: z.ZodDefault<z.ZodNumber>;
        bodyLimit: z.ZodDefault<z.ZodString>;
        publicDir: z.ZodDefault<z.ZodString>;
        pdfDir: z.ZodDefault<z.ZodString>;
        pdfTtlMs: z.ZodDefault<z.ZodNumber>;
        publicIpUrl: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        host: string;
        port: number;
        tenantsDir: string;
        logsDir: string;
        logLevel: "trace" | "debug" | "info" | "warn" | "error";
        logRetentionDays: number;
        bodyLimit: string;
        publicDir: string;
        pdfDir: string;
        pdfTtlMs: number;
        publicIpUrl?: string | undefined;
    }, {
        host?: string | undefined;
        port?: number | undefined;
        tenantsDir?: string | undefined;
        logsDir?: string | undefined;
        logLevel?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
        logRetentionDays?: number | undefined;
        bodyLimit?: string | undefined;
        publicDir?: string | undefined;
        pdfDir?: string | undefined;
        pdfTtlMs?: number | undefined;
        publicIpUrl?: string | undefined;
    }>>;
    defaults: z.ZodObject<{
        soap: z.ZodString;
        genesisIp: z.ZodString;
        facturonURL: z.ZodDefault<z.ZodString>;
        whatsapp: z.ZodObject<{
            baseUrl: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            baseUrl: string;
        }, {
            baseUrl: string;
        }>;
        tables: z.ZodObject<{
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
        }>;
        sri: z.ZodObject<{
            codDocSustento: z.ZodRecord<z.ZodString, z.ZodString>;
            codImpuestoRetencion: z.ZodRecord<z.ZodString, z.ZodString>;
            formaPago: z.ZodRecord<z.ZodString, z.ZodString>;
            tarifaIVA: z.ZodRecord<z.ZodString, z.ZodString>;
            impuesto: z.ZodRecord<z.ZodString, z.ZodString>;
            codigoIVA: z.ZodArray<z.ZodObject<{
                porcentaje: z.ZodNumber;
                codigo: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                porcentaje: number;
                codigo: number;
            }, {
                porcentaje: number;
                codigo: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        }, {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        }>;
        mailTask: z.ZodObject<{
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
        }>;
        ride: z.ZodObject<{
            optionsRIDE: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            RIDE: z.ZodObject<{
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
            }>;
            mailTemplate: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            optionsRIDE: Record<string, unknown>;
            RIDE: {
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
            };
            mailTemplate: string;
        }, {
            RIDE: {
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
            };
            mailTemplate: string;
            optionsRIDE?: Record<string, unknown> | undefined;
        }>;
    }, "strict", z.ZodTypeAny, {
        soap: string;
        genesisIp: string;
        facturonURL: string;
        whatsapp: {
            baseUrl: string;
        };
        tables: {
            file: string;
            cabecera: string;
            movimiento: string;
        };
        sri: {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        };
        mailTask: {
            status: boolean;
            frequency: string;
            lastComprobantesDays: number;
            top: number;
        };
        ride: {
            optionsRIDE: Record<string, unknown>;
            RIDE: {
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
            };
            mailTemplate: string;
        };
    }, {
        soap: string;
        genesisIp: string;
        whatsapp: {
            baseUrl: string;
        };
        tables: {
            file: string;
            cabecera: string;
            movimiento: string;
        };
        sri: {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        };
        mailTask: {
            status: boolean;
            frequency: string;
            lastComprobantesDays: number;
            top: number;
        };
        ride: {
            RIDE: {
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
            };
            mailTemplate: string;
            optionsRIDE?: Record<string, unknown> | undefined;
        };
        facturonURL?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    server: {
        host: string;
        port: number;
        tenantsDir: string;
        logsDir: string;
        logLevel: "trace" | "debug" | "info" | "warn" | "error";
        logRetentionDays: number;
        bodyLimit: string;
        publicDir: string;
        pdfDir: string;
        pdfTtlMs: number;
        publicIpUrl?: string | undefined;
    };
    defaults: {
        soap: string;
        genesisIp: string;
        facturonURL: string;
        whatsapp: {
            baseUrl: string;
        };
        tables: {
            file: string;
            cabecera: string;
            movimiento: string;
        };
        sri: {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        };
        mailTask: {
            status: boolean;
            frequency: string;
            lastComprobantesDays: number;
            top: number;
        };
        ride: {
            optionsRIDE: Record<string, unknown>;
            RIDE: {
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
            };
            mailTemplate: string;
        };
    };
}, {
    defaults: {
        soap: string;
        genesisIp: string;
        whatsapp: {
            baseUrl: string;
        };
        tables: {
            file: string;
            cabecera: string;
            movimiento: string;
        };
        sri: {
            codDocSustento: Record<string, string>;
            codImpuestoRetencion: Record<string, string>;
            formaPago: Record<string, string>;
            tarifaIVA: Record<string, string>;
            impuesto: Record<string, string>;
            codigoIVA: {
                porcentaje: number;
                codigo: number;
            }[];
        };
        mailTask: {
            status: boolean;
            frequency: string;
            lastComprobantesDays: number;
            top: number;
        };
        ride: {
            RIDE: {
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
            };
            mailTemplate: string;
            optionsRIDE?: Record<string, unknown> | undefined;
        };
        facturonURL?: string | undefined;
    };
    server?: {
        host?: string | undefined;
        port?: number | undefined;
        tenantsDir?: string | undefined;
        logsDir?: string | undefined;
        logLevel?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
        logRetentionDays?: number | undefined;
        bodyLimit?: string | undefined;
        publicDir?: string | undefined;
        pdfDir?: string | undefined;
        pdfTtlMs?: number | undefined;
        publicIpUrl?: string | undefined;
    } | undefined;
}>;
export type AppJson = z.infer<typeof appJsonSchema>;
export declare const DEFAULT_APP_CONFIG_FILE = "./config/app.config.json";
export declare function loadAppJson(file: string): AppJson;
