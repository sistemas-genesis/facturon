import { z } from 'zod';
import {
  mailTaskSchema,
  rideSchema,
  tablesSchema,
} from '../config/app-json.js';

const logLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']);

/**
 * Configuracion de UNA empresa (un JSON en TENANTS_DIR): todo lo suyo en un solo archivo aislado.
 * Equivale a un elemento de params.databases[] del proyecto legacy, mas los parametros que alli
 * eran globales y que cada empresa puede sobrescribir (soap, genesisIp, tablas, facturonURL,
 * whatsapp.baseUrl, mailTask, ride); lo que no defina lo hereda de `defaults` en app.config.json.
 * Un campo desconocido invalida el archivo (evita errores de tipeo).
 */
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
    /** Transporte nodemailer (SMTP u OAuth2). auth.user se usa como remitente. */
    mail: z
      .object({
        auth: z.object({ user: z.string() }).passthrough(),
      })
      .passthrough()
      .optional(),
    mailsDefault: z
      .object({ manual: z.boolean(), mail: z.string() })
      .optional(),
    /** Si se define, reemplaza al mailTask global de app.config.json. */
    mailTask: mailTaskSchema.optional(),
    /** Bloque legado de firma electronica: ya no se usa; se acepta y se descarta para no invalidar JSON antiguos (schema estricto). */
    firma: z.unknown().optional().transform(() => undefined),
    /** Reemplazos puntuales del RIDE/mail global (si no, se usa app.config.json). */
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
    /** Sobrescrituras opcionales de los `defaults` globales. */
    soap: z.string().url().optional(),
    genesisIp: z.string().url().optional(),
    facturonURL: z.string().optional(),
    tables: tablesSchema.optional(),
  })
  .strict();

export type Tenant = z.infer<typeof tenantSchema>;
