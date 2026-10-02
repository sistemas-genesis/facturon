import { parseStringPromise } from 'xml2js';
export function tipoFromXml(result) {
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
export function parseXml(xml) {
    return parseStringPromise(xml);
}
export function getValorFromXml(json) {
    let res = 0;
    if (json && typeof json === 'object' && Object.keys(json).length > 0) {
        switch (Object.keys(json)[0]) {
            case 'factura':
                res = json.factura?.infoFactura[0]?.importeTotal[0];
                break;
            case 'comprobanteRetencion':
                if (parseFloat(json.comprobanteRetencion['$'].version) >= 2)
                    json.comprobanteRetencion?.docsSustento[0]?.docSustento[0]?.retenciones[0].retencion.forEach((i) => {
                        res += parseFloat(i.valorRetenido[0]);
                    });
                else
                    json.comprobanteRetencion?.impuestos[0]?.impuesto.forEach((i) => {
                        res += parseFloat(i.valorRetenido[0]);
                    });
                res = res.toFixed(2);
                break;
            case 'notaCredito':
                res = json.notaCredito?.infoNotaCredito[0]?.totalSinImpuestos[0];
                break;
            case 'notaDebito':
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
export function getMailFromXml(node) {
    if (node?.infoAdicional) {
        for (const c of node.infoAdicional[0].campoAdicional ?? []) {
            if (c['$'].nombre == 'Email')
                return c['_'];
        }
    }
    return false;
}
export function stripAccents(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
export function isset(obj) {
    return ((typeof obj !== 'undefined' &&
        obj != '' &&
        !!obj &&
        obj !== null &&
        obj !== 'null') ||
        false);
}
//# sourceMappingURL=sri-xml.js.map