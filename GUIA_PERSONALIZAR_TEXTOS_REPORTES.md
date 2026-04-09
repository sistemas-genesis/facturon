# Guia para Personalizar los Textos Visibles en los Reportes (RIDE)

## Archivo a modificar

```
src/controllers/documento.js
```

Este es el unico archivo que necesitas editar. Contiene el codigo que genera los reportes PDF (llamados RIDE) de: Facturas, Retenciones, Notas de Credito, Guias de Remision y Liquidaciones de Compra.

---

## Regla de oro: Solo cambia lo que esta entre comillas

El archivo contiene codigo de programacion mezclado con textos que aparecen en el reporte. Tu solo debes cambiar **las palabras que estan entre comillas** (`"..."` o `'...'`). Nunca toques las palabras de programacion.

### Palabras que NUNCA debes tocar

Estas son palabras reservadas del codigo. Si las cambias, el sistema dejara de funcionar:

| Palabra | Para que sirve |
|---------|---------------|
| `var`, `const`, `let` | Crean variables |
| `if`, `else` | Condiciones |
| `forEach`, `map` | Recorren listas |
| `function` | Define funciones |
| `return` | Devuelve resultados |
| `body +=` | Agrega contenido al reporte |
| `parseFloat`, `toFixed` | Calculos matematicos |
| `style=` | Diseno visual (colores, tamanos) |
| `<td>`, `<tr>`, `<th>`, `<table>` | Estructura de la tabla |
| `colspan`, `rowspan` | Organizacion de celdas |

### Como identificar lo que SI puedes cambiar

Busca textos legibles en espanol que esten **entre comillas** y dentro de etiquetas HTML. Por ejemplo:

```
NO TOQUES ESTO          PUEDES CAMBIAR ESTO          NO TOQUES ESTO
      |                        |                           |
      v                        v                           v
<td style="...">    SUBTOTAL SIN IMPUESTO        </td>
```

---

## Seccion 1: FACTURA (lineas 174 a 633)

### 1.1 Titulo del documento (linea 188)

```javascript
// ANTES (linea 188):
        F A C T U R A

// DESPUES (ejemplo):
        D O C U M E N T O   D E   V E N T A
```

Solo cambia el texto `F A C T U R A`. No toques las etiquetas `<td>` ni el `style="..."`.

---

### 1.2 Encabezados de la empresa (lineas 211 a 266)

**Numero de autorizacion (linea 211):**
```javascript
// ANTES:
        Numero de autorizacion:

// DESPUES (ejemplo):
        No. Autorizacion SRI:
```

**Etiqueta "Matriz" (linea 215):**
```javascript
// ANTES:
<td style="border-left: 1px solid black; font-weight: bold">Matriz</td>

// DESPUES:
<td style="border-left: 1px solid black; font-weight: bold">Principal</td>
```

**Fecha y hora de autorizacion (linea 231):**
```javascript
// ANTES:
<span style="font-weight: bold">Fecha y hora de autorizacion: </span>

// DESPUES:
<span style="font-weight: bold">Autorizado el: </span>
```

**Ambiente (linea 243):**
```javascript
// ANTES:
<span style="font-weight: bold">Ambiente: </span>

// DESPUES:
<span style="font-weight: bold">Tipo de Ambiente: </span>
```

**Obligado a llevar contabilidad (linea 252):**
```javascript
// ANTES:
Obligado a llevar contabilidad: ${factura.infoFactura[0].obligadoContabilidad[0]}

// DESPUES:
Lleva contabilidad: ${factura.infoFactura[0].obligadoContabilidad[0]}
```

> **IMPORTANTE:** El texto `${factura.infoFactura[0].obligadoContabilidad[0]}` es una variable que trae datos automaticamente. NUNCA lo modifiques.

**Emision (linea 255):**
```javascript
// ANTES:
<span style="font-weight: bold">Emision: </span>

// DESPUES:
<span style="font-weight: bold">Tipo de Emision: </span>
```

**Clave de acceso (linea 266):**
```javascript
// ANTES:
<td style="padding-left: 2em; font-weight: bold">Clave de acceso:</td>

// DESPUES:
<td style="padding-left: 2em; font-weight: bold">Codigo de acceso:</td>
```

---

### 1.3 Datos del cliente (lineas 279 a 300)

**Razon Social (linea 282):**
```javascript
// ANTES:
<span style="font-weight: bold">Razon Social / Nombres y Apellidos:</span>

// DESPUES:
<span style="font-weight: bold">Cliente:</span>
```

**RUC/CI (linea 287):**
```javascript
// ANTES:
<td style="font-weight: bold">RUC /CI:</td>

// DESPUES:
<td style="font-weight: bold">Identificacion:</td>
```

**Fecha (linea 289):**
```javascript
// ANTES:
<td style="font-weight: bold">Fecha:</td>

// DESPUES:
<td style="font-weight: bold">Fecha de emision:</td>
```

**Direccion (linea 294):**
```javascript
// ANTES:
<span style="font-weight: bold">Direccion: </span>

// DESPUES:
<span style="font-weight: bold">Domicilio: </span>
```

**Placa (linea 298):**
```javascript
// ANTES:
<span style="font-weight: bold">Placa: </span>

// DESPUES:
<span style="font-weight: bold">Placa del vehiculo: </span>
```

---

### 1.4 Informacion Adicional (linea 428)

```javascript
// ANTES (linea 428):
          Informacion Adicional

// DESPUES:
          Datos Adicionales
```

---

### 1.5 Totales de la factura (lineas 441 a 594)

**SUBTOTAL con porcentaje (linea 441):**
```javascript
// ANTES:
<td colspan="3" style="background-color: #f5f5f5">SUBTOTAL ${nombreImpuesto}%</td>

// DESPUES:
<td colspan="3" style="background-color: #f5f5f5">BASE IMPONIBLE ${nombreImpuesto}%</td>
```

> **CUIDADO:** `${nombreImpuesto}` es una variable. Solo cambia la palabra `SUBTOTAL`.

**SUBTOTAL 0% (linea 517):**
```javascript
// ANTES:
SUBTOTAL 0%

// DESPUES:
BASE GRAVADA 0%
```

**SUBTOTAL NO OBJETO DE IVA (linea 527):**
```javascript
// ANTES:
SUBTOTAL NO OBJETO DE IVA

// DESPUES:
NO SUJETO A IVA
```

**SUBTOTAL SIN IMPUESTO (linea 535):**
```javascript
// ANTES:
SUBTOTAL SIN IMPUESTO

// DESPUES:
SUBTOTAL ANTES DE IMPUESTO
```

**SUBTOTAL SIN DESCUENTO (linea 542):**
```javascript
// ANTES:
SUBTOTAL SIN DESCUENTO

// DESPUES:
SUBTOTAL BRUTO
```

**TOTAL DESCUENTO (linea 549):**
```javascript
// ANTES:
TOTAL DESCUENTO

// DESPUES:
DESCUENTO APLICADO
```

**ICE (linea 558):**
```javascript
// ANTES:
ICE

// DESPUES:
IMPUESTO ICE
```

**IVA con porcentaje (linea 575):**
```javascript
// ANTES:
IVA ${nombreIVA} %

// DESPUES:
IMPUESTO IVA ${nombreIVA} %
```

> **CUIDADO:** `${nombreIVA}` es una variable. Solo cambia las palabras alrededor.

**TOTAL (linea 586):**
```javascript
// ANTES:
TOTAL

// DESPUES:
VALOR TOTAL A PAGAR
```

**Forma de pago (linea 594):**
```javascript
// ANTES:
Forma de pago:

// DESPUES:
Metodo de pago:
```

---

### 1.6 Subsidio (lineas 618 a 629) - Solo si aplica

```javascript
// ANTES (linea 618):
VALOR TOTAL SIN SUBSIDIO

// DESPUES:
TOTAL ANTES DE SUBSIDIO
```

```javascript
// ANTES (linea 624):
AHORRO POR SUBSIDIO

// DESPUES:
DESCUENTO POR SUBSIDIO
```

```javascript
// ANTES (linea 629):
Incluye IVA cuando corresponda

// DESPUES:
IVA incluido donde aplique
```

---

## Seccion 2: COMPROBANTE DE RETENCION (lineas 662 a 860)

### 2.1 Titulo del documento (linea 730)

```javascript
// ANTES:
COMPROBANTE DE RETENCIÓN

// DESPUES (ejemplo):
COMPROBANTE DE RETENCIÓN TRIBUTARIA
```

### 2.2 Encabezados de la tabla de retenciones (linea 786)

Esta es una linea larga. Los textos que puedes cambiar son:

```
COMPROBANTE | NUMERO | FECHA EMISION | EJERCICIO FISCAL | BASE IMPONIBLE | IMPUESTO | PORCENTAJE DE RETENCION | VALOR RETENIDO
```

**Ejemplo - cambiar "PORCENTAJE DE RETENCION":**
```javascript
// ANTES:
<th>PORCENTAJE DE RETENCIÓN</th>

// DESPUES:
<th>% RETENIDO</th>
```

### 2.3 Total de retencion (linea 830)

```javascript
// ANTES:
TOTAL DE RETENCIÓN:

// DESPUES:
MONTO TOTAL RETENIDO:
```

---

## Seccion 3: NOTA DE CREDITO (desde linea 1171)

### 3.1 Titulo (linea 1171)

```javascript
// ANTES:
NOTA DE CRÉDITO

// DESPUES (ejemplo):
NOTA DE CRÉDITO ELECTRÓNICA
```

> Hay una segunda nota de credito desde la linea 1382 con el mismo titulo. Si cambias uno, cambia el otro tambien para mantener consistencia.

---

## Seccion 4: GUIA DE REMISION (desde linea 1578)

### 4.1 Titulo (linea 1578)

```javascript
// ANTES:
GUÍA DE REMISIÓN

// DESPUES (ejemplo):
GUÍA DE DESPACHO
```

---

## Seccion 5: LIQUIDACION DE COMPRA (desde linea 1803)

### 5.1 Titulo (linea 1803)

```javascript
// ANTES:
LIQUIDACIÓN DE COMPRA

// DESPUES (ejemplo):
LIQUIDACIÓN DE COMPRA DE BIENES
```

---

## Resumen rapido: Que SI y que NO cambiar

| Puedo cambiar | Ejemplo |
|--------------|---------|
| Textos en espanol entre comillas | `"SUBTOTAL"` -> `"BASE IMPONIBLE"` |
| Etiquetas visibles del reporte | `"Forma de pago:"` -> `"Metodo de pago:"` |
| Titulos de columnas entre `<th>...</th>` | `<th>NUMERO</th>` -> `<th>No.</th>` |

| NO debo cambiar | Ejemplo |
|-----------------|---------|
| Variables con `${}` | `${factura.infoFactura[0].importeTotal[0]}` |
| Etiquetas HTML | `<td>`, `<tr>`, `</table>` |
| Estilos CSS | `style="background-color: #f5f5f5"` |
| Funciones de JavaScript | `parseFloat()`, `.toFixed(2)` |
| Operadores y asignaciones | `body +=`, `var`, `const` |

---

## Procedimiento paso a paso

1. **Haz una copia de seguridad** del archivo `documento.js` antes de empezar.
   ```
   Copia el archivo y renombralo como: documento_respaldo.js
   ```

2. **Abre el archivo** `src/controllers/documento.js` con cualquier editor de texto (Notepad, VS Code, Sublime Text, etc.).

3. **Usa "Buscar" (Ctrl+F)** para localizar el texto que quieres cambiar. Por ejemplo, busca `SUBTOTAL SIN IMPUESTO`.

4. **Cambia SOLO el texto en espanol**, sin tocar nada mas en esa linea.

5. **Guarda el archivo** (Ctrl+S).

6. **Reinicia la aplicacion** para ver los cambios reflejados en los reportes.

7. **Si algo sale mal**, reemplaza el archivo modificado con tu copia de seguridad.

---

## Ejemplo completo: Antes y Despues

### Antes (linea 535 original):
```javascript
      <td colspan="3" style="background-color: #f5f5f5  ">SUBTOTAL SIN IMPUESTO</td>
```

### Despues (linea 535 modificada):
```javascript
      <td colspan="3" style="background-color: #f5f5f5  ">SUBTOTAL ANTES DE IMPUESTOS</td>
```

Observa que:
- `<td colspan="3" style="background-color: #f5f5f5  ">` quedo **exactamente igual**
- `</td>` quedo **exactamente igual**
- Solo cambio `SUBTOTAL SIN IMPUESTO` por `SUBTOTAL ANTES DE IMPUESTOS`

---

## Errores comunes a evitar

| Error | Que pasa | Como evitarlo |
|-------|----------|---------------|
| Borrar una comilla `"` o `'` | El sistema da error y no genera el PDF | Asegurate de que cada comilla de apertura tenga su comilla de cierre |
| Borrar un `${}` | El dato dinamico desaparece del reporte | Nunca toques texto que empiece con `${` y termine con `}` |
| Cambiar `<td>` o `</td>` | La tabla del reporte se descuadra | Solo modifica texto entre `>` y `<` |
| Borrar un backtick `` ` `` | El bloque de codigo se rompe | Los backticks (comilla invertida) delimitan secciones grandes de HTML, no los toques |
| Agregar caracteres especiales como `<` o `>` | Se confunden con etiquetas HTML | Usa solo letras, numeros, espacios y signos basicos (: , . %) |

---

## Mejoras del archivo actual vs el archivo antiguo (documento_old.js)

El archivo `documento.js` actual tiene varias mejoras importantes respecto a `documento_old.js`. A continuacion se explica cada una, por que importa, y como copiar fragmentos de uno a otro sin romper el codigo.

---

### Mejora 1: Nombre del impuesto dinamico (la mas importante)

**Problema en el archivo viejo:** Los porcentajes de IVA estaban escritos "a mano" directamente en el codigo. Si el gobierno cambiaba la tarifa (como paso del 12% al 15%), habia que editar manualmente cada lugar.

**Archivo viejo (documento_old.js, lineas ~247-271):**
```javascript
'<td colspan="2" style="background-color: #f5f5f5  ">SUBTOTAL(12%)</td>'    // <-- "12%" escrito a mano
'<td colspan="2" style="background-color: #f5f5f5  ">SUBTOTAL(0%)</td>'
'<td colspan="2" style="background-color: #f5f5f5  ">IVA</td>'             // <-- No dice que porcentaje
```

**Archivo nuevo (documento.js, lineas 432-454 y 565-582):**
```javascript
// El sistema BUSCA automaticamente el nombre del porcentaje:
nombreImpuesto = params.getItem(params.sri.codigoIVA, 'codigo', codigoPorcentaje, 'porcentaje')

// Y lo usa en la etiqueta:
body += `<td colspan="3" style="background-color: #f5f5f5">SUBTOTAL ${nombreImpuesto}%</td>`
//                                                                    ^^^^^^^^^^^^^^^^
//                                                         Esto se llena solo: "15", "12", "0", etc.

// Lo mismo para el IVA:
body += `<td colspan="3" style="background-color: #f5f5f5  ">IVA ${nombreIVA} %</td>`
//                                                               ^^^^^^^^^^^
//                                                    Muestra "IVA 15 %" o "IVA 12 %" automaticamente
```

Ademas, el archivo viejo usaba `if/else` para detectar los codigos de impuesto de forma fija:
```javascript
// VIEJO - solo reconocia codigo '2' (12%) y '6' (no objeto de IVA):
if (i.codigo == '2' && i.codigoPorcentaje == '2') { ... }
else if (i.codigo == '2' && i.codigoPorcentaje == '6') { ... }
```

El nuevo usa `.map()` y recorre TODOS los impuestos automaticamente, sin importar cuantos sean ni que porcentaje tengan.

---

### Mejora 2: Logos en base64 (no depende de rutas de archivo)

**Archivo viejo:**
```javascript
var imgSrc = 'file://' + __dirname + '../../public/img/' + utilities.getLogoByRuc(...);
```
Usaba rutas `file://` que dependian de la ubicacion exacta del servidor. Si se movia la carpeta, el logo no aparecia.

**Archivo nuevo (lineas 138-154):**
```javascript
const logoPath = path.normalize(imgSrc);
if (fs.existsSync(logoPath)) {
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  imgSrc = `data:image/jpeg;base64,${logoBase64}`;
} else {
  console.warn('Logo no encontrado en ruta:', logoPath);
  imgSrc = '';
}
```
Lee la imagen y la convierte a base64. Si no la encuentra, no se cae: simplemente deja el logo vacio y avisa en la consola.

---

### Mejora 3: Columna de descuento en detalle de factura

**Archivo viejo:** La tabla de detalle NO tenia columna de descuento por item.

**Archivo nuevo (lineas 330-331 y 382-388):**
```javascript
// Encabezado nuevo:
body += `<th>${params.RIDE.name.descuento}</th>`;

// Valor por cada fila:
body += `<td><span style="float: right; background-color: #f5f5f5">
  ${parseFloat(i.descuento[0]).toFixed(2)}</span></td>`;
```

---

### Mejora 4: Consultas SQL mas livianas

**Archivo viejo (linea ~21):** Traia `ce_xml` y `xml_autorizado` en las consultas de listado (campos muy pesados con el XML completo).

**Archivo nuevo (lineas 18-34):** Ya no trae esos campos en la consulta de listado, solo los trae cuando se necesitan individualmente. Esto hace que la aplicacion cargue mas rapido.

---

### Mejora 5: Guia de Remision mas segura

**Archivo viejo:** Accedia directamente a `i.razonSocialDestinatario[0]` sin verificar que existiera. Si el XML venia incompleto, se caia.

**Archivo nuevo (lineas 1641-1680):**
```javascript
var razonSocialDestinatario = i.razonSocialDestinatario ? i.razonSocialDestinatario[0] : "";
var identificacionDestinatario = i.identificacionDestinatario ? i.identificacionDestinatario[0] : "";
var dirDestinatario = i.dirDestinatario ? i.dirDestinatario[0] : "";
```
Ahora verifica primero si el campo existe. Si no existe, pone texto vacio en vez de fallar.

---

### Mejora 6: Endpoint nuevo getXmlById

**Archivo nuevo (lineas 84-110):** Permite obtener un XML individual por su ID, con limpieza de caracteres especiales y manejo de errores (404 si no existe, 500 si hay error de servidor). Este endpoint no existia en el viejo.

---

## Como copiar un fragmento de un archivo a otro sin romper el codigo

Si necesitas tomar una seccion del archivo nuevo y colocarla en otro lugar (o viceversa), sigue estas reglas:

### Regla 1: Identifica los limites de la seccion

Cada tipo de documento es una **funcion completa** que empieza y termina asi:

```javascript
ctrl.nombreFuncion = (req, res) => {    // <-- INICIO de la funcion
    ...todo el codigo...
};                                       // <-- FIN de la funcion (punto y coma incluido)
```

Las funciones en el archivo nuevo son:

| Funcion | Linea inicio | Linea fin | Que genera |
|---------|-------------|-----------|------------|
| `ctrl.rideFactura` | 112 | 659 | Factura |
| `ctrl.rideRetencion` | 662 | 878 | Retencion v1 |
| `ctrl.rideRetencion2` | 881 | 1103 | Retencion v2 |
| `ctrl.rideCredito` | 1106 | 1329 | Nota de Credito v1 |
| `ctrl.rideDebito` | 1332 | 1517 | Nota de Debito |
| `ctrl.rideRemision` | 1520 | 1737 | Guia de Remision |
| `ctrl.rideLiquidacion` | 1740 | 2073 | Liquidacion de Compra |

### Regla 2: Copia funciones completas, no pedazos sueltos

**CORRECTO** - Copiar desde `ctrl.rideFactura = (req, res) => {` hasta su `};` de cierre:
```
ctrl.rideFactura = (req, res) => {
    ...todo el contenido...
};   // <-- asegurate de incluir este punto y coma
```

**INCORRECTO** - Copiar solo las lineas del medio sin la funcion que las envuelve. Esto causa errores porque las variables no estarian definidas.

### Regla 3: Si copias solo un bloque de HTML (etiquetas), respeta los backticks

Los bloques de HTML en el archivo nuevo usan **backticks** (`` ` ``), no comillas normales:

```javascript
body += `                          // <-- backtick de apertura
    <td>SUBTOTAL ${nombre}%</td>
`;                                 // <-- backtick de cierre
```

Si en el archivo viejo el mismo bloque usa comillas simples y concatenacion con `+`:

```javascript
body +=
    '<td>SUBTOTAL 15%</td>';       // <-- comilla simple
```

**No puedes mezclarlos.** Si pegas un bloque con backticks dentro de una seccion que usa comillas simples (o viceversa), se rompe. Debes:
- Copiar el bloque completo desde un backtick de apertura hasta su backtick de cierre, O
- Convertir el formato manualmente para que coincida con el estilo del destino.

### Regla 4: Verifica las variables que usa el fragmento

Antes de pegar un fragmento, revisa si usa variables que existen en el destino. Por ejemplo:

El bloque nuevo del IVA usa `nombreIVA` y `params.getItem(params.sri.codigoIVA, ...)`. Si pegas esto en un archivo que no tiene esas variables definidas, fallara.

**Lista de verificacion antes de pegar:**
1. Busca todas las variables en el fragmento (todo lo que NO sea HTML puro)
2. Verifica que esas variables existan en el archivo destino
3. Si no existen, necesitas copiar tambien el codigo donde se definen

### Regla 5: Ejemplo practico - copiar el bloque de IVA dinamico

Si quisieras llevar la mejora del IVA dinamico del archivo nuevo al viejo, necesitarias copiar **tres partes**:

**Parte 1 - Las variables (archivo nuevo, lineas 418-420):**
```javascript
var nombreImpuesto = '15%'
let nombreIVA = '15%';
let codigo = 0; codigoPorcentaje = 0;
```

**Parte 2 - El bloque de SUBTOTAL dinamico (archivo nuevo, lineas 432-454):**
Reemplaza el bloque viejo de `SUBTOTAL(12%)` / `SUBTOTAL(0%)`.

**Parte 3 - El bloque de IVA dinamico (archivo nuevo, lineas 565-582):**
Reemplaza la linea vieja que solo decia `IVA`.

Y asegurate de que el archivo destino tenga acceso a `params.sri.codigoIVA` y `params.getItem()`.

---

### Resumen: Checklist para copiar fragmentos

- [ ] Identifique la funcion completa (desde `ctrl.nombre =` hasta `};`)
- [ ] Si solo copio un bloque HTML, respeto los backticks o comillas del destino
- [ ] Verifique que todas las variables del fragmento existen en el destino
- [ ] No mezclo estilos de comillas (backtick con comilla simple)
- [ ] Despues de pegar, guarde y reinicie la aplicacion para probar
- [ ] Si algo falla, restauro desde mi copia de seguridad
