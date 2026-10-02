import { z } from 'zod';
import { mailTaskSchema, rideSchema, tablesSchema, } from '../config/app-json.js';
const logLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']);
export const tenantSchema = z
    .object({
    slug: z
        .string()
        .regex(/^[a-z0-9][a-z0-9_-]{1,62}$/, 'slug: minusculas, numeros, _ o -'),
    enabled: z.boolean().default(true),
    ruc: z.string().min(10).max(13),
    nombreComercial: z.string().min(1),
    logLevel: logLevel.optional(),
    db: z.object({
        host: z.string(),
        port: z.coerce.number().int().positive(),
        db: z.string(),
        user: z.string(),
        pass: z.string(),
    }),
    estacion: z.string().default(''),
    punto: z.string().default(''),
    mail: z
        .object({
        auth: z.object({ user: z.string() }).passthrough(),
    })
        .passthrough()
        .optional(),
    mailsDefault: z
        .object({ manual: z.boolean(), mail: z.string() })
        .optional(),
    mailTask: mailTaskSchema.optional(),
    firma: z
        .object({
        path: z.string().default(''),
        pass: z.string().default(''),
        add: z.number().default(0),
        avisar_desde_dia: z.number().default(0),
    })
        .default({ path: '', pass: '', add: 0, avisar_desde_dia: 0 }),
    ride: z
        .object({
        optionsRIDE: z.record(z.unknown()).optional(),
        RIDE: rideSchema.optional(),
        mailTemplate: z.string().optional(),
    })
        .optional(),
    leyenda_catastro: z
        .object({
        status: z.boolean(),
        key: z.string(),
        size: z.number(),
        breakLine: z.string(),
    })
        .optional(),
    subsidio: z
        .object({
        status: z.boolean(),
        label: z
            .object({
            subsidio: z.string(),
            precio_sin_subsidio: z.string(),
            valor_total_sin_subsidio: z.string(),
            ahorro_subsidio: z.string(),
        })
            .optional(),
    })
        .default({ status: false }),
    logo: z
        .object({
        path: z.string().default(''),
        width: z.string().optional(),
        height: z.string().optional(),
    })
        .optional(),
    whatsapp: z
        .object({ phoneNumberId: z.string(), baseUrl: z.string().url() })
        .partial()
        .optional(),
    soap: z.string().url().optional(),
    genesisIp: z.string().url().optional(),
    facturonURL: z.string().optional(),
    tables: tablesSchema.optional(),
})
    .strict();
//# sourceMappingURL=tenant.types.js.map