import { readFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
export const APP_JSON = Symbol('APP_JSON');
const logLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']);
export const rideSchema = z.object({
    name: z.object({
        codigoPrincipal: z.string(),
        codigoAuxiliar: z.string().default('COD. AUXILIAR'),
        cantidad: z.string(),
        descripcion: z.string(),
        precioUnitario: z.string(),
        descuento: z.string(),
        precioTotal: z.string(),
    }),
    optionalItems: z.object({
        detAdicional: z
            .object({
            status: z.boolean(),
            mode: z.number().int(),
            names: z.array(z.string()).default([]),
        })
            .default({ status: false, mode: -1, names: [] }),
        codigoAuxiliar: z.boolean().default(false),
        propina: z
            .object({ status: z.boolean(), name: z.string() })
            .default({ status: false, name: 'SERVICIO' }),
    }),
});
export const mailTaskSchema = z.object({
    status: z.boolean(),
    frequency: z.string().min(1),
    lastComprobantesDays: z.number().int().min(0),
    top: z.number().int().min(1),
});
const dictionary = z.record(z.string());
export const tablesSchema = z.object({
    file: z.string(),
    cabecera: z.string(),
    movimiento: z.string(),
});
export const appJsonSchema = z
    .object({
    server: z
        .object({
        host: z.string().min(1).default('127.0.0.1'),
        port: z.number().int().positive().default(3090),
        tenantsDir: z.string().default('./config/tenants'),
        logsDir: z.string().default('./logs'),
        logLevel: logLevel.default('info'),
        logRetentionDays: z.number().int().min(1).default(30),
        bodyLimit: z.string().default('500mb'),
        publicDir: z.string().default('./public'),
        pdfDir: z.string().default('./tmp/pdf'),
        pdfTtlMs: z.number().int().min(0).default(30000),
        publicIpUrl: z.string().url().optional(),
    })
        .strict()
        .default({}),
    defaults: z
        .object({
        soap: z.string().url(),
        genesisIp: z.string().url(),
        facturonURL: z.string().default(''),
        whatsapp: z.object({ baseUrl: z.string().url() }),
        tables: tablesSchema,
        sri: z.object({
            codDocSustento: dictionary,
            codImpuestoRetencion: dictionary,
            formaPago: dictionary,
            tarifaIVA: dictionary,
            impuesto: dictionary,
            codigoIVA: z.array(z.object({ porcentaje: z.number(), codigo: z.number() })),
        }),
        mailTask: mailTaskSchema,
        ride: z.object({
            optionsRIDE: z.record(z.unknown()).default({}),
            RIDE: rideSchema,
            mailTemplate: z.string().min(1),
        }),
    })
        .strict(),
})
    .strict();
export const DEFAULT_APP_CONFIG_FILE = './config/app.config.json';
export function loadAppJson(file) {
    const path = resolve(file);
    let raw;
    try {
        raw = JSON.parse(readFileSync(path, 'utf8'));
    }
    catch (e) {
        const reason = e.code === 'ENOENT'
            ? 'no existe'
            : 'JSON invalido';
        throw new Error(`No se pudo cargar la configuracion '${path}': ${reason}. ` +
            `Copie config/app.config.example.json a config/app.config.json.`);
    }
    const parsed = appJsonSchema.safeParse(raw);
    if (!parsed.success) {
        const detail = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('\n - ');
        throw new Error(`Configuracion invalida en '${path}':\n - ${detail}`);
    }
    return parsed.data;
}
//# sourceMappingURL=app-json.js.map