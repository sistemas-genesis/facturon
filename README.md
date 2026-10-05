# FacturON API (NestJS, multiempresa)

Un solo proceso para todas las empresas. Reemplaza al Express legacy (`../genesis-facturon/src`) con las mismas rutas, entradas y salidas (ver rutas en `CONFIGURACION.md`, seccion 7).

**Uso local, sin clientes externos.** Esta API no la llama ningun otro sistema: se levanta en la maquina y se conecta a las bases de datos de las distintas empresas. Escucha solo en `127.0.0.1` (`server.host` en el JSON), no tiene API keys, `/admin` ni rate limit.

**Cada empresa es un JSON aislado** (`config/tenants/<slug>.json`) con todo lo suyo: BD, correo, logo, WhatsApp, RIDE, tablas, etc. (como cada elemento de `params.databases[]` del original). La config global `config/app.config.json` es minima: `server` (host, puerto, carpetas, logs) y `defaults` (valores de negocio que toda empresa hereda si su JSON no los define: soap, genesisIp, tablas, whatsapp.baseUrl, SRI, mailTask, RIDE, plantilla de correo). El `.env` es opcional y solo sobrescribe `server`. Ver `CONFIGURACION.md`.

## Arranque
```bash
npm install
npm run import:app-config -- --write   # crea config/app.config.json (global) desde ../genesis-facturon/src/libs/params.js
                                        # (o: cp config/app.config.example.json config/app.config.json y editarlo)
npm run import:params                  # prueba: muestra que empresas importaria
npm run import:params -- --write       # crea config/tenants/<slug>.json (una por empresa)
npm run build && npm start    # o: npm run start:dev
```

## Agregar una empresa (sin reiniciar)
- Crear `config/tenants/<slug>.json` (ver `config/tenants/example.json.sample`). El proceso detecta el cambio solo.
- Los JSON tienen credenciales: estan en `.gitignore`.

## Ejemplo de configuración de una empresa

Un JSON por empresa en `config/tenants/<slug>.json` (el nombre del archivo **debe** ser `<slug>.json`). Se recarga solo, sin reiniciar. Todos los datos son ficticios; el mismo contenido está en `config/tenants/example.json.sample` (ese sí se versiona; los `*.json` reales no).

### Ejemplo completo

```json
{
  "slug": "mi-empresa",
  "enabled": true,
  "ruc": "1790000000001",
  "nombreComercial": "MI EMPRESA S.A.",
  "logLevel": "info",
  "db": {
    "host": "localhost",
    "port": 4011,
    "db": "mi_bd",
    "user": "dba",
    "pass": "cambiar-esta-clave"
  },
  "estacion": "001",
  "punto": "001",
  "mail": {
    "host": "mail.midominio.com",
    "port": 25,
    "tls": { "rejectUnauthorized": false },
    "auth": { "user": "facturacion@midominio.com", "pass": "cambiar-esta-clave" }
  },
  "mailsDefault": { "manual": false, "mail": "copia@midominio.com" },
  "mailTask": { "status": false, "frequency": "*/3 * * * *", "lastComprobantesDays": 3, "top": 10 },
  "logo": { "path": "data/tenants/mi-empresa/logo.jpg", "width": "50%", "height": "auto" },
  "ride": {
    "optionsRIDE": { "format": "A4", "orientation": "portrait" },
    "RIDE": {
      "name": { "codigoPrincipal": "COD.", "cantidad": "CANT.", "descripcion": "DESCRIPCION", "precioUnitario": "PRECIO", "descuento": "DESC.", "precioTotal": "SUBTOTAL" },
      "optionalItems": { "codigoAuxiliar": false, "propina": { "status": false, "name": "SERVICIO" } }
    }
  },
  "leyenda_catastro": { "status": true, "key": ".", "size": 10, "breakLine": "/" },
  "subsidio": {
    "status": false,
    "label": {
      "subsidio": "Subsidio",
      "precio_sin_subsidio": "P. Sin Subsidio",
      "valor_total_sin_subsidio": "Valor Total Sin Subsidio",
      "ahorro_subsidio": "Ahorro por Subsidio"
    }
  },
  "whatsapp": { "phoneNumberId": "00000000-0000-0000-0000-000000000000", "baseUrl": "http://whatsapp.example.com:5822" }
}
```

Opcionalmente la empresa puede sobrescribir los `defaults` globales con `soap`, `genesisIp`, `facturonURL`, `tables`, `whatsapp.baseUrl`, `mailTask` y `ride`.

### Ejemplo mínimo

```json
{
  "slug": "mi-empresa",
  "ruc": "1790000000001",
  "nombreComercial": "MI EMPRESA S.A.",
  "db": { "host": "localhost", "port": 4011, "db": "mi_bd", "user": "dba", "pass": "cambiar-esta-clave" }
}
```

### Qué es obligatorio

- Obligatorios: `slug` (minúsculas, números, `_` o `-`; 2 a 63 caracteres, empieza con letra o número), `ruc` (10 a 13 caracteres), `nombreComercial`, y `db` con sus 5 campos `host`, `port`, `db`, `user`, `pass`.
- Opcionales con valor por defecto: `enabled` (`true`), `estacion` (`""`), `punto` (`""`).
- Opcionales sin valor por defecto: `logLevel` (`trace|debug|info|warn|error`), `mail`, `mailsDefault` (`{ manual: boolean, mail: string }`), `mailTask`, `logo`, `ride`, `leyenda_catastro`, `subsidio`, `whatsapp` (`{ phoneNumberId, baseUrl }`), `soap`, `genesisIp`, `facturonURL`, `tables` (sobrescriben `defaults`).
- No se aceptan campos desconocidos: el archivo se rechaza (se conserva la versión válida anterior, si existía).
- El esquema real está en `src/tenants/tenant.types.ts`; el ejemplo se valida con `npm test` (`src/tenants/tenant.types.spec.ts`).

## Modulos (`src/`)
`config` (JSON tipado con zod: `APP_JSON`, `APP_CONFIG`) · `tenants` (registro, guard por `:db`, contexto, `TenantSettings` = defaults + JSON de la empresa) · `logger` (pino por empresa + auditoria `operation()/audited()`) · `database` (driver Sybase inyectable `DbDriver`, helpers SQL seguros) · `documentos` · `ride` (PDF pdfmake, 7 tipos) · `mail` (correo, WhatsApp, tarea programada) · `genesis` · `uploader` (SRI SOAP -> tablas temp) · `gasolinera` · `params` · `pdf` · `web` (front estatico en `public/`).

## Logs por empresa
`logs/<slug>/app-YYYY-MM-DD.log` (todo) y `error-YYYY-MM-DD.log` (solo errores, con stack); `logs/_system/` para eventos globales.
JSON por linea con `tenant`, `requestId`, `event`; las contrasenas/tokens salen como `[REDACTED]`.
Cada operacion de negocio queda como `event: "empresa.operacion"` con `empresaRuc`, `empresaNombre`, `accion`, `resultado` (`ok|error|omitido`), `requestId`/`correlationId` y hora (`time`). Ejemplo en `CONFIGURACION.md` seccion 5.
- Ver: abrir el archivo de la empresa en `logs/<slug>/`.
- Subir detalle solo para una empresa: `logLevel` en su JSON (se aplica al guardar el archivo, sin reiniciar).
- En codigo: inyectar `TenantLoggerService` y usar `logger.info('msg', {..})`; escribe en el log de la empresa del request/tarea actual.

## Seleccion de empresa (`TenantGuard`)
Un unico selector, como el original: el parametro `:db` de la ruta (`/api/.../:db/...`) es el nombre de la BD de la empresa. Las rutas por RUC (`/api/documento/ride/*`) eligen la empresa por el RUC del XML/ruta. Empresa inexistente, deshabilitada o `:db` ambiguo (mismo nombre de BD en dos empresas) => 404. Cada empresa usa solo su JSON: su BD, su correo y su logo; lo que no define lo toma de `defaults`, nunca de otra empresa.

## Scripts
`npm run build`, `npm run start:dev`, `npm run lint` (oxlint), `npm run format` (prettier), `npm test` (unitarios, vitest), `npm run test:e2e` (aislamiento por empresa + paridad funcional de todas las rutas, vitest).

## Arquitectura
Misma organización que `../api`: ESM (`"type": "module"`, imports con `.js`), NestJS 12, TypeScript 6, config validada en `src/config/app-json.ts` y `src/config/app-config.ts` (tokens `APP_JSON` y `APP_CONFIG`, sin `ConfigService` en los servicios), `src/app.setup.ts` compartido por `main.ts` y los e2e, vitest + oxlint + prettier. Sin prefijo global ni versionado de rutas (igual que `api`); las rutas legacy `/api/.../:db/...` se conservan tal cual.
