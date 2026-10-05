# Configuración de FacturON API (multiempresa, uso local)

Esta API **no es llamada por ningún otro sistema**: se levanta localmente (escucha solo en `127.0.0.1`) y se conecta a las bases de datos de distintas empresas. Por eso no hay API keys, `/admin`, rate limit ni CORS.

Igual que `genesis-facturon` (donde cada elemento de `params.databases[]` es una empresa), **cada empresa es un JSON aislado con todo lo suyo**. Lo global es mínimo y solo aporta valores por defecto:

| Nivel | Dónde | Qué controla | ¿Reinicia el proceso? |
|---|---|---|---|
| Global (mínimo) | `config/app.config.json` | `server` (host, puerto, carpetas, logs) y `defaults` (valores de negocio compartidos que toda empresa hereda) | Sí |
| Por empresa | `config/tenants/<slug>.json` | Todo lo de la empresa: BD, correo, logo, WhatsApp, RIDE, tablas, soap, etc. Puede sobrescribir cualquier `defaults` | **No** (recarga sola) |

Regla práctica: si el dato es de una empresa, va en su JSON; si es igual para todas (catálogos SRI, plantilla de correo, URL del SRI), va en `defaults`.
`.env` es **opcional**: una variable de entorno, si existe, sobrescribe la sección `server`.

---

## 1. Global: `config/app.config.json`

Crear con `npm run import:app-config -- --write` (toma lo global del `params.js` legacy) o copiando `config/app.config.example.json`. Está en `.gitignore`; el `.example.json` sí se versiona. La ruta puede cambiarse con `APP_CONFIG_FILE`. Si falta o es inválido, el proceso no arranca y dice qué campo falla.

Estructura: `{ "server": {...}, "defaults": {...} }`.

**`server`** (del proceso, nada de empresas):

| Campo | Descripción |
|---|---|
| `host` | Interfaz de escucha. Default `127.0.0.1` (solo esta máquina). Poner otra IP o `0.0.0.0` solo si de verdad se necesita acceso desde otra máquina: no hay autenticación |
| `port` `tenantsDir` `logsDir` `logLevel` `logRetentionDays` | Servidor y logs (ver variables más abajo) |
| `bodyLimit` | Tamaño máximo de body (el legacy aceptaba `500mb`) |
| `publicDir` | Carpeta del front estático (`./public`) |
| `pdfDir` / `pdfTtlMs` | Carpeta de los PDF de RIDE y tiempo (ms) que se conservan antes de borrarse (30000 como el legacy) |
| `publicIpUrl` | Servicio que devuelve la IP pública (para `/api/params/publicip`; el front lo usa para su modo "acceso público") |

**`defaults`** (lo hereda toda empresa que no lo defina en su JSON):

| Campo | Descripción | ¿La empresa puede sobrescribirlo? |
|---|---|---|
| `soap` | URL del WS de autorización del SRI | sí (`soap`) |
| `genesisIp` | URL base del servicio Genesis (con `/` final) | sí (`genesisIp`) |
| `facturonURL` | Texto/URL que se inserta en el correo (`%facturonURL%`) | sí (`facturonURL`) |
| `whatsapp.baseUrl` | Base del servicio WhatsApp Genesis | sí (`whatsapp.baseUrl`) |
| `tables` | `file`, `cabecera`, `movimiento`: tablas del UploaderFacturas | sí (`tables`) |
| `mailTask` | `status`, `frequency` (cron de 5 campos), `lastComprobantesDays`, `top` | sí (`mailTask`) |
| `ride` | `RIDE` (rótulos/columnas), `optionsRIDE`, `mailTemplate` | sí (`ride`) |
| `sri` | Catálogos: `codDocSustento`, `codImpuestoRetencion`, `formaPago`, `tarifaIVA`, `impuesto`, `codigoIVA` | no (son del SRI, iguales para todas) |

### Variables de entorno (opcionales, sobrescriben `server`)

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `APP_CONFIG_FILE` | no | `./config/app.config.json` | Ruta del JSON global |
| `API_HOST` | no | `server.host` (`127.0.0.1`) | Interfaz de escucha (no se usa `HOST` a propósito: muchos sistemas ya la definen con otro sentido) |
| `PORT` | no | `server.port` | Puerto del servicio (el Express legacy usa 3081) |
| `BODY_LIMIT`, `PUBLIC_DIR`, `PDF_DIR`, `PDF_TTL_MS` | no | `server.*` | Ver tabla del JSON |
| `TENANTS_DIR` | no | `./config/tenants` | Carpeta con un JSON por empresa |
| `LOGS_DIR` | no | `./logs` | Carpeta de logs (una subcarpeta por empresa) |
| `LOG_LEVEL` | no | `info` | `trace`, `debug`, `info`, `warn`, `error` |
| `LOG_RETENTION_DAYS` | no | `30` | Días que se conservan los logs antes de borrarse |
| `NODE_ENV` | no | `production` | En `production` se oculta Swagger (`/docs`) |

Si una variable o un campo del JSON es inválido, el proceso no arranca y dice cuál.

---

## 2. Por empresa: `config/tenants/<slug>.json`

- **El nombre del archivo debe ser igual al `slug`** (`pita_nova.json` → `"slug": "pita_nova"`).
- Contiene credenciales: está en `.gitignore` y se crea con permisos `600`. No subir a git.
- Un archivo inválido se reporta en `logs/_system/` y **no afecta a las demás empresas**; si ya existía una versión válida, se conserva.

### Campos obligatorios

| Campo | Ejemplo | Notas |
|---|---|---|
| `slug` | `"pita_nova"` | Identificador interno. Minúsculas, números, `_` o `-`. 2 a 63 caracteres. Nombre de su carpeta de logs |
| `ruc` | `"1490826722001"` | 10 a 13 caracteres |
| `nombreComercial` | `"PITANOVA S.A."` | |
| `db.host` `db.port` `db.db` `db.user` `db.pass` | ver abajo | Conexión Sybase de la empresa |

### Campos opcionales

| Campo | Default | Descripción |
|---|---|---|
| `enabled` | `true` | `false` la desactiva (404 en sus rutas, el scheduler la ignora) |
| `logLevel` | el de `.env` | Nivel de log solo de esta empresa (útil para poner `debug` a una) |
| `estacion`, `punto` | `""` | Filtro de establecimiento / punto de emisión (vacío = todos) |
| `mail` | — | Transporte nodemailer (SMTP u OAuth2), ver abajo |
| `mailsDefault` | — | `{ "manual": false, "mail": "copia@empresa.com" }` |
| `mailTask` | — | Parámetros del envío automático, ver abajo |
| `logo` | — | `{ "path", "width", "height" }` |
| `ride` | — | `optionsRIDE`, `RIDE` (rótulos y columnas) y `mailTemplate` |
| `leyenda_catastro` | — | `{ "status", "key", "size", "breakLine" }` |
| `subsidio` | — | `{ "status", "label": {...} }` |
| `whatsapp` | — | `{ "phoneNumberId": "...", "baseUrl": "..." }` (`baseUrl` opcional, si no usa `defaults`) |
| `soap`, `genesisIp`, `facturonURL`, `tables` | `defaults` | Sobrescriben el valor global solo para esta empresa |

> Estos bloques ya los consumen los módulos: `mail`/`mailsDefault`/`whatsapp` (correo y WhatsApp), `logo`/`ride`/`subsidio`/`leyenda_catastro` (RIDE) y `mailTask` (envío automático). Lo que la empresa define (`ride`, `mailTask`, `tables`, `soap`, `genesisIp`, `facturonURL`, `whatsapp.baseUrl`) reemplaza al `defaults` de `app.config.json` solo para ella; si no lo define, hereda el global. Esa mezcla se hace en un único lugar (`TenantSettings`).
> `logo.path` se resuelven respecto al directorio desde el que se inicia el proceso.

Un campo desconocido hace que el archivo sea rechazado (evita errores de tipeo como `nombreComerical`).

### Ejemplo mínimo

```json
{
  "slug": "mi-empresa",
  "ruc": "1790000000001",
  "nombreComercial": "MI EMPRESA S.A.",
  "db": { "host": "localhost", "port": 4011, "db": "mi_bd", "user": "dba", "pass": "********" }
}
```

### Ejemplo completo

Es el mismo de `config/tenants/example.json.sample` y de la sección "Ejemplo de configuración de una empresa" del `README.md` (datos ficticios, validado con `tenantSchema`):

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

Con Gmail (OAuth2), `mail` lleva en lugar de `auth.pass`:

```json
"mail": {
  "service": "gmail",
  "auth": { "type": "OAuth2", "user": "x@gmail.com", "clientId": "...", "clientSecret": "...", "refreshToken": "..." }
}
```

---

## 3. Agregar una empresa

**Opción A — archivo** (la más simple): crear `config/tenants/<slug>.json`. En menos de un segundo el proceso lo detecta; aparece en los logs de `_system`: `Empresa agregada: <slug>`.

**Opción B — importar las empresas del proyecto actual:**

```bash
cd nest
npm run import:params              # prueba, no escribe nada
npm run import:params -- --write   # crea los JSON (no pisa los que ya existen)
```

Para **desactivar** una empresa: `"enabled": false`. Para **quitarla**: borrar su JSON (sus logs se conservan hasta vencer la retención).

---

## 4. Cómo se identifica la empresa en cada request

Un único selector, como en el original: **`:db`** (nombre de la BD de la empresa) en las rutas `/api/.../:db/...`. Las rutas que traen el RUC (`/api/documento/ride/*` por el RUC del XML) eligen a la empresa dueña de ese RUC (con `estacion`/`punto` como desempate, igual que el legacy).

Reglas:
- Inexistente o deshabilitada → **404** genérico.
- Dos empresas con el mismo nombre de BD → `:db` es ambiguo y responde **404** (no se adivina). Usar nombres de BD distintos o dejar una sola habilitada.
- Aislamiento: cada empresa usa **solo su JSON** (su BD, correo, logo, WhatsApp, tablas, log). Lo que no define lo toma de `defaults`, nunca del JSON de otra. Cada una escribe únicamente en `logs/<slug>/`.
- No hay `X-Api-Key`, `X-Tenant` ni `:tenant`: se eliminaron.

---

## 5. Logs

```
logs/
├── _system/              arranque, recarga de empresas, scheduler, requests sin empresa
│   └── app-2026-09-30.log
└── pita_nova/
    ├── app-2026-09-30.log      todo lo de la empresa
    └── error-2026-09-30.log    solo errores, con stack
```

Cada línea es un JSON:

```json
{"level":30,"time":"2026-09-30T10:15:02.123Z","tenant":"pita_nova","event":"http.request","requestId":"…","method":"GET","path":"/api/…","status":200,"ms":42,"msg":"request"}
```

**Qué empresa envía cada documento.** Cada operación de negocio (correo, WhatsApp, RIDE, consulta, uploader, tarea automática) deja una línea `event: "empresa.operacion"` en el log de la empresa que la ejecuta (la dueña del RUC emisor del XML para correo/RIDE; la de `:db` para el resto):

```json
{"level":30,"time":"2026-10-02T16:16:15.224Z","tenant":"pita_nova","event":"empresa.operacion","empresaRuc":"1490826722001","empresaNombre":"PITANOVA S.A.","accion":"mail.enviar","resultado":"ok","requestId":"8378985e-daf4-4ec6-be86-7c375b5d49e8","ceId":"10","tipo":"factura","comprobante":"001-001-000000123","baseDatos":"pita_nova","destinatarios":2,"ms":19,"messageId":"<abc@x>","msg":"[PITANOVA S.A. | RUC 1490826722001] mail.enviar -> ok"}
```

`resultado` es `ok`, `error` (también en `error-*.log` con stack) u `omitido`. Las tareas automáticas usan `correlationId` (una pasada = un id). Acciones: `documentos.buscar|buscarTodos|xmlPorId`, `ride.<tipo>`, `mail.enviar`, `whatsapp.token|enviar|comprobante`, `genesis.ride|ride_blob`, `uploader.compra|compraIndividual|ventaIndividual`, `gasolinera.persona`, `mailtask.consulta|comprobante`. Los destinatarios no se escriben en el log (solo su cantidad), ni el contenido de los XML.

Los campos `pass`, `password`, `token`, `apiKey`, `clientSecret`, `refreshToken` y `authorization` (hasta dos niveles de anidación) salen como `[REDACTED]`. Un JSON de empresa con sintaxis inválida se reporta solo como `JSON invalido` (sin citar su contenido, que puede traer credenciales).

Consulta: abrir directamente los archivos de `logs/<slug>/` (por ejemplo `tail -f logs/pita_nova/error-2026-09-30.log`). Para subir el detalle solo de una empresa, poner `"logLevel": "debug"` en su JSON (se aplica al guardar, sin reiniciar).

---

## 6. Rutas (paridad con genesis-facturon)

Mismas rutas, entradas y formatos que el Express original; las rutas con `:db` pasan por `TenantGuard` (empresa por BD, 404 si no existe o es ambigua).

| Método y ruta | Respuesta |
|---|---|
| `POST /api/documento/ride/{factura,retencion,retencion2,credito,debito,remision,liquidacion}/:fechaAutorizacion` body `{xml}` | 200 texto `<claveAcceso>.pdf` |
| `GET /api/pdf/:file` | descarga del PDF (solo nombres `<clave>.pdf` de `server.pdfDir`) |
| `POST /api/documento/:cedula_ruc&:start&:end&:db` / `POST /api/documentoLike/:start&:end&:db` body `{empresas,estacion,punto,tipos,params:{fecha_autorizacion}}` | 200 JSON con filas |
| `GET /api/getXmlById/:db/:id` | 200 `application/xml`; 404 `{success:false,msg:"XML no disponible"}`; 500 `{success:false,msg}` |
| `GET /api/mail/:db/:ce_id/:mails` | 200 vacío |
| `GET /api/genesis/ride/:db/:clave_acceso` / `ride_blob` | 200 vacío / 200 PDF en base64 |
| `GET /api/getFacturaCompra/:db/:sesion`, `getFacturaCompraIndividual/:db/:sesion/:clave`, `getFacturaVentaIndividual/:db/:sesion/:clave` | 200 vacío (sigue en segundo plano) |
| `GET /api/persona/:db/:cedula` | 200 vacío |
| `GET /api/params/empresas`, `/api/params/publicip` | JSON |
| `GET /api/params/config` | 200 config para el panel `/config` (sin clave, solo lectura; contraseñas siempre enmascaradas). Reemplaza a `/api/params/login/:key` (eliminada) |
| `GET /health` | Estado y cantidad de empresas |
| `GET /config`, `GET *` | front (`public/config.html`, `public/index.html`) |

Requiere Java (driver Sybase `node-sybase`) en el servidor, igual que el original.

## 7. Carpetas recomendadas en el servidor Windows

```
C:\facturon\nest\
├── config\app.config.json
├── public\                                       (front estático)
├── config\tenants\*.json
├── data\tenants\<slug>\logo.jpg      (rutas relativas en el JSON)
└── logs\<slug>\...
```

Haz copia de respaldo de `config\app.config.json`, `config\tenants` y `data\tenants`.
