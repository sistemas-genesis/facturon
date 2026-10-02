import { parseStringPromise } from 'xml2js';

/** Tipos de RIDE que sabe generar el servicio (segmento de la ruta /api/documento/ride/:tipo). */
export type RideTipo =
  | 'factura'
  | 'retencion'
  | 'retencion2'
  | 'credito'
  | 'debito'
  | 'remision'
  | 'liquidacion';

/** Nodo raiz del XML del SRI -> tipo de RIDE. La retencion v2+ usa su propia plantilla. */
export function tipoFromXml(result: Record<string, any>): RideTipo | '' {
  const root = Object.keys(result)[0];
  switch (root) {
    case 'factura':
      return 'factura';
    case 'liquidacionCompra':
      return 'liquidacion';
    case 'notaCredito':
      return 'credito';
    case 'notaDebito':
      return 'debito';
    case 'guiaRemision':
      return 'remision';
    case 'comprobanteRetencion':
      return parseFloat(result[root]?.['$']?.version) >= 2
        ? 'retencion2'
        : 'retencion';
    default:
      return '';
  }
}

/** Parseo equivalente al xml2js.parseString del legacy (arreglos y atributos en '$'). */
export function parseXml(xml: string): Promise<Record<string, any>> {
  return parseStringPromise(xml);
}

/** Importe que se muestra en el correo (utilities.getValorFromXml del legacy). */
export function getValorFromXml(json: Record<string, any>): string | number {
  let res: any = 0;
  if (json && typeof json === 'object' && Object.keys(json).length > 0) {
    switch (Object.keys(json)[0]) {
      case 'factura':
        res = json.factura?.infoFactura[0]?.importeTotal[0];
        break;
      case 'comprobanteRetencion':
        if (parseFloat(json.comprobanteRetencion['$'].version) >= 2)
          json.comprobanteRetencion?.docsSustento[0]?.docSustento[0]?.retenciones[0].retencion.forEach(
            (i: any) => {
              res += parseFloat(i.valorRetenido[0]);
            },
          );
        else
          json.comprobanteRetencion?.impuestos[0]?.impuesto.forEach(
            (i: any) => {
              res += parseFloat(i.valorRetenido[0]);
            },
          );
        res = res.toFixed(2);
        break;
      case 'notaCredito':
        res = json.notaCredito?.infoNotaCredito[0]?.totalSinImpuestos[0];
        break;
      case 'notaDebito':
        // el legacy omitia el [0] de infoNotaDebito y fallaba siempre
        res = json.notaDebito.infoNotaDebito[0].totalSinImpuestos[0];
        break;
      case 'liquidacionCompra':
        res = json.liquidacionCompra.infoLiquidacionCompra[0].importeTotal[0];
        break;
      case 'guiaRemision':
        res = '';
        break;
    }
  }
  return res;
}

/** Campo adicional "Email" del comprobante (utilities.getMailFromXml). */
export function getMailFromXml(node: Record<string, any>): string | false {
  if (node?.infoAdicional) {
    for (const c of node.infoAdicional[0].campoAdicional ?? []) {
      if (c['$'].nombre == 'Email') return c['_'];
    }
  }
  return false;
}

/** Quita acentos/diacriticos (el legacy los normalizaba antes de insertar en las tablas temp). */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** true si el valor existe y no esta vacio (utilities.isset). */
export function isset(obj: unknown): boolean {
  return (
    (typeof obj !== 'undefined' &&
      obj != '' &&
      !!obj &&
      obj !== null &&
      obj !== 'null') ||
    false
  );
}
