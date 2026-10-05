import { readFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

export const APP_JSON = Symbol('APP_JSON');

const logLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']);

/** Rotulos y columnas del RIDE (mismos nombres que params.RIDE del proyecto legacy). */
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
        /** 0 columnas en movimiento, 1 observacion al final, 2 como un producto mas */
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
export type RideConfig = z.infer<typeof rideSchema>;

export const mailTaskSchema = z.object({
  status: z.boolean(),
  // expresion cron de 5 campos (cada 3 minutos: ver config de ejemplo)
  frequency: z.string().min(1),
  lastComprobantesDays: z.number().int().min(0),
  top: z.number().int().min(1),
});
export type MailTaskConfig = z.infer<typeof mailTaskSchema>;

const dictionary = z.record(z.string());

/** Catalogos y reglas de negocio compartidos: valores por defecto de toda empresa. */
export const tablesSchema = z.object({
  file: z.string(),
  cabecera: z.string(),
  movimiento: z.string(),
});
export type TablesConfig = z.infer<typeof tablesSchema>;

/**
 * Configuracion GLOBAL minima de config/app.config.json:
 * - `server`: lo que es del proceso (host, puerto, carpetas, logs). Nada de empresas.
 * - `defaults`: valores de negocio que TODA empresa hereda si su JSON no los define
 *   (soap, genesisIp, tablas, whatsapp, mailTask, RIDE, plantilla de correo y catalogos SRI).
 * Todo lo propio de una empresa (BD, mail, logo, whatsapp...) vive en
 * config/tenants/<slug>.json y puede sobrescribir cualquiera de los `defaults`.
 */
export const appJsonSchema = z
  .object({
    server: z
      .object({
        /** Solo local por defecto: el servidor escucha unicamente en esta interfaz. */
        host: z.string().min(1).default('127.0.0.1'),
        port: z.number().int().positive().default(3090),
        tenantsDir: z.string().default('./config/tenants'),
        logsDir: z.string().default('./logs'),
        logLevel: logLevel.default('info'),
        logRetentionDays: z.number().int().min(1).default(30),
        /** limite del body (el legacy aceptaba 500mb) */
        bodyLimit: z.string().default('500mb'),
        publicDir: z.string().default('./public'),
        /** carpeta donde se escriben los PDF de RIDE antes de descargarse */
        pdfDir: z.string().default('./tmp/pdf'),
        pdfTtlMs: z.number().int().min(0).default(30000),
        /** servicio que devuelve la IP publica (para /api/params/publicip) */
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
          codigoIVA: z.array(
            z.object({ porcentaje: z.number(), codigo: z.number() }),
          ),
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

export type AppJson = z.infer<typeof appJsonSchema>;

export const DEFAULT_APP_CONFIG_FILE = './config/app.config.json';

/** Lee y valida el JSON. Un error de formato nunca cita el contenido (puede traer secretos). */
export function loadAppJson(file: string): AppJson {
  const path = resolve(file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    const reason =
      (e as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'no existe'
        : 'JSON invalido';
    throw new Error(
      `No se pudo cargar la configuracion '${path}': ${reason}. ` +
        `Copie config/app.config.example.json a config/app.config.json.`,
    );
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
