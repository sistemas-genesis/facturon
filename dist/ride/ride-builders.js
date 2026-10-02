import fs from 'fs';
import path from 'path';
import moment from 'moment';
const COLOR_NOMBRE = '#2239ff';
const COLOR_SECUENCIAL = '#3583ea';
const COLOR_AZUL = '#0d47a1';
const COLOR_NEGRO = '#000000';
const BG_TOTAL = '#f5f5f5';
const BG_TOTAL_ALT = '#eeeeee';
function px(n) { return n || 0; }
function money(v) { return '$ ' + Number(v || 0).toFixed(2); }
function text(v) { return v == null ? '' : String(v); }
function lineAll(width = 1, color = '#000000', pad = [4, 4, 4, 4]) {
    return {
        hLineWidth: () => width,
        vLineWidth: () => width,
        hLineColor: () => color,
        vLineColor: () => color,
        paddingLeft: () => pad[0],
        paddingTop: () => pad[1],
        paddingRight: () => pad[2],
        paddingBottom: () => pad[3]
    };
}
function lineLight(width = 0.6, color = '#dddddd', pad = [4, 6, 4, 6]) {
    return {
        hLineWidth: () => width,
        vLineWidth: () => width,
        hLineColor: () => color,
        vLineColor: () => color,
        paddingLeft: () => pad[0],
        paddingTop: () => pad[1],
        paddingRight: () => pad[2],
        paddingBottom: () => pad[3]
    };
}
function outerOnlyBoxLayout() {
    return {
        hLineWidth: function (i, node) {
            return (i === 0 || i === node.table.body.length) ? 1 : 0;
        },
        vLineWidth: function (i, node) {
            return (i === 0 || i === node.table.widths.length) ? 1 : 0;
        },
        hLineColor: function () { return '#000000'; },
        vLineColor: function () { return '#000000'; },
        paddingLeft: function () { return 8; },
        paddingRight: function () { return 8; },
        paddingTop: function () { return 5; },
        paddingBottom: function () { return 5; }
    };
}
function noBorders(pad = [0, 0, 0, 0]) {
    return {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => pad[0],
        paddingTop: () => pad[1],
        paddingRight: () => pad[2],
        paddingBottom: () => pad[3]
    };
}
function roundedBoxLayout() {
    return {
        hLineWidth: (i, node) => 1,
        vLineWidth: (i, node) => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4
    };
}
function outerRoundedLikeBox() {
    return {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0),
        vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? 1 : 0),
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 4,
        paddingBottom: () => 4
    };
}
function empresaBoxOldStyle() {
    return {
        hLineWidth: (i, node) => (i <= 6 ? 1 : 0),
        vLineWidth: (i, node) => (i === 0 || i === 1 || i === 2 ? 1 : 0),
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft: (i) => (i === 2 ? 10 : 4),
        paddingRight: () => 4,
        paddingTop: () => 2,
        paddingBottom: () => 2
    };
}
function baseDocDef() {
    return {
        pageSize: 'A4',
        pageMargins: [26, 20, 26, 20],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 8,
            color: '#000000'
        },
        content: []
    };
}
function parseImgWidth(cfg) {
    if (!cfg)
        return 130;
    const s = String(cfg);
    if (s.endsWith('%')) {
        const pct = parseFloat(s);
        if (isNaN(pct))
            return 130;
        return Math.round(260 * (pct / 100));
    }
    const n = parseFloat(s);
    return isNaN(n) ? 130 : n;
}
function loadLogo(rawPath) {
    if (!rawPath)
        return '';
    try {
        const logoPath = path.normalize(rawPath);
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            return 'data:image/jpeg;base64,' + logoBase64;
        }
    }
    catch (e) {
        console.error('Error leyendo logo:', e.message);
    }
    return '';
}
function rideBanner() {
    return {
        margin: [0, 0, 0, 10],
        stack: [
            {
                canvas: [
                    {
                        type: 'polyline',
                        closePath: true,
                        points: [
                            { x: 0, y: 0 },
                            { x: 120, y: 0 },
                            { x: 60, y: 23 },
                            { x: 0, y: 23 }
                        ],
                        color: '#1a1a1a'
                    }
                ],
                absolutePosition: { x: 26, y: 20 }
            },
            {
                table: {
                    widths: ['*'],
                    body: [[{
                                text: 'REPRESENTACIÓN IMPRESA DOCUMENTO ELECTRÓNICO (RIDE)',
                                alignment: 'center',
                                bold: true,
                                color: 'white',
                                fillColor: '#1b4ea3',
                                fontSize: 14,
                                margin: [4, 5, 4, 5]
                            }]]
                },
                layout: noBorders([0, 0, 0, 0])
            }
        ],
    };
}
function buildTopHeader({ imgSrc, imgWidth, nombreComercial, ruc, titulo, secuencial }) {
    const logoCell = imgSrc
        ? { image: imgSrc, width: parseImgWidth(imgWidth), alignment: 'center', rowSpan: 4, margin: [0, 2, 0, 0] }
        : { text: '', rowSpan: 4 };
    return {
        margin: [0, 0, 0, 8],
        layout: noBorders([8, 2, 8, 2]),
        table: {
            widths: ['38%', '62%'],
            body: [
                [logoCell, { text: text(nombreComercial), color: COLOR_NOMBRE, alignment: 'center', fontSize: 12, margin: [0, 6, 0, 0] }],
                [{ text: '' }, { text: 'R.U.C.: ' + text(ruc), alignment: 'center', fontSize: 11, margin: [0, 0, 0, 0] }],
                [{ text: '' }, { text: text(titulo), alignment: 'center', fontSize: 11.5, bold: true, color: 'white', fillColor: '#000000', margin: [0, 4, 0, 4] }],
                [{ text: '' }, { text: text(secuencial), alignment: 'center', fontSize: 10.5, color: COLOR_SECUENCIAL }]
            ]
        }
    };
}
function buildEmpresaAutorizacionOldStyle(opts) {
    const leyenda = opts.leyendaCatastro
        ? text(opts.leyendaCatastro.text).replace(/<br>/g, '\n')
        : '';
    return {
        margin: [0, 0, 0, 8],
        table: {
            widths: ['48%', '52%'],
            body: [
                [
                    {
                        table: {
                            widths: ['*'],
                            body: [[{
                                        stack: [{
                                                canvas: [{
                                                        type: 'rect',
                                                        x: 0, y: 0, w: 260, h: 75, r: 8, lineColor: '#000000', lineWidth: 1
                                                    }],
                                                margin: [0, 0, 0, -75]
                                            },
                                            {
                                                stack: [
                                                    { text: text(opts.razonSocial), bold: false, margin: [0, 0, 0, 3] },
                                                    {
                                                        columns: [
                                                            { width: 70, text: 'Matriz', bold: true },
                                                            { width: '*', text: text(opts.matrizDir) }
                                                        ],
                                                        margin: [0, 0, 0, 3]
                                                    },
                                                    {
                                                        columns: [
                                                            { width: 70, text: 'Suc. (' + text(opts.estab) + ')', bold: true },
                                                            { width: '*', text: text(opts.sucDir) }
                                                        ],
                                                        margin: [0, 0, 0, 3]
                                                    },
                                                    { text: 'Contribuyente Especial: ' + text(opts.contribuyenteEspecial), margin: [0, 0, 0, 3] },
                                                    { text: 'Obligado a llevar contabilidad: ' + text(opts.obligadoContabilidad), margin: [0, 0, 0, 3] },
                                                    { text: leyenda, fontSize: 7, margin: [0, 0, 0, 0] }
                                                ],
                                                margin: [5, 5, 5, 5]
                                            }
                                        ]
                                    }]]
                        },
                        layout: noBorders([5, 5, 3, 0])
                    },
                    {
                        border: [false, false, false, false],
                        margin: [14, 0, 0, 0],
                        stack: [
                            { text: 'Número de autorización:', bold: true, margin: [0, 0, 0, 3] },
                            { text: text(opts.claveAcceso), margin: [0, 0, 0, 8] },
                            {
                                text: [
                                    { text: 'Fecha y hora de autorización: ', bold: true },
                                    text(opts.fechaAutorizacion)
                                ],
                                margin: [0, 0, 0, 8]
                            },
                            {
                                text: [
                                    { text: 'Ambiente: ', bold: true },
                                    text(opts.ambiente)
                                ],
                                margin: [0, 0, 0, 3]
                            },
                            {
                                text: [
                                    { text: 'Emisión: ', bold: true },
                                    text(opts.tipoEmision)
                                ],
                                margin: [0, 0, 0, 8]
                            },
                            { text: 'Clave de acceso:', bold: true, margin: [0, 0, 0, 3] },
                            { text: text(opts.claveAcceso), margin: [0, 0, 0, 4] },
                            opts.barcode
                                ? { image: opts.barcode, width: 240, margin: [0, 0, 0, 0] }
                                : { text: '' }
                        ]
                    }
                ]
            ]
        },
        layout: noBorders([0, 0, 0, 0])
    };
}
function getItem(json, clave, valor, item) {
    for (let i = 0; i < (json || []).length; i++) {
        if (json[i][clave] == valor)
            return json[i][item];
    }
    return -1;
}
function g(o, k, def = '') {
    if (!o || o[k] == null)
        return def;
    const v = Array.isArray(o[k]) ? o[k][0] : o[k];
    if (v && typeof v === 'object' && '_' in v)
        return v._;
    return v == null ? def : v;
}
function num(v) {
    const n = parseFloat(Array.isArray(v) ? v[0] : v);
    return isNaN(n) ? 0 : n;
}
function thead(t, align = 'center') {
    return { text: text(t), bold: true, color: 'white', fillColor: COLOR_AZUL, alignment: align, fontSize: 7.5, margin: [0, 2, 0, 2] };
}
function td(v, opts = {}) {
    return { text: text(v), fontSize: 7.5, ...opts };
}
function tdNum(v, opts = {}) {
    return { text: text(v), fontSize: 7.5, alignment: 'right', ...opts };
}
function tdMoney(v, opts = {}) {
    return { text: money(v), fontSize: 7.5, alignment: 'right', ...opts };
}
function totalRow(label, value, bold = false) {
    const v = typeof value === 'number' ? Number(value).toFixed(2) : text(value);
    return [
        { text: text(label), fillColor: BG_TOTAL, bold, fontSize: 7.5 },
        { text: '$ ' + v, alignment: 'right', fillColor: BG_TOTAL, bold, fontSize: 7.5 }
    ];
}
function infoAdicionalStack(node, extras = []) {
    const items = [];
    const campos = node.infoAdicional && node.infoAdicional[0] && node.infoAdicional[0].campoAdicional
        ? node.infoAdicional[0].campoAdicional
        : [];
    campos.concat(extras).forEach((i) => {
        const nombre = i['$'] ? i['$'].nombre : '';
        items.push({
            text: [{ text: '-' + text(nombre) + ': ', color: COLOR_AZUL }, { text: text(i['_']) }],
            fontSize: 7,
            margin: [0, 0, 0, 2]
        });
    });
    return [{ text: 'Información Adicional', color: COLOR_AZUL, fontSize: 8, margin: [0, 0, 0, 3] }, ...items];
}
function clienteBox(rows) {
    const body = rows.map((pairs) => {
        if (pairs.length === 1) {
            return [
                { text: text(pairs[0][0]), bold: true },
                { text: text(pairs[0][1]), colSpan: 3 },
                {},
                {}
            ];
        }
        return [
            { text: text(pairs[0][0]), bold: true },
            { text: text(pairs[0][1]) },
            { text: text(pairs[1][0]), bold: true },
            { text: text(pairs[1][1]) }
        ];
    });
    return {
        margin: [0, 0, 0, 8],
        table: { widths: ['auto', '*', 'auto', 'auto'], body },
        layout: outerOnlyBoxLayout()
    };
}
function pushRideBase(doc, cfg) {
    doc.content.push(rideBanner());
    doc.content.push(buildTopHeader(cfg.header));
    doc.content.push(buildEmpresaAutorizacionOldStyle(cfg.empresa));
    doc.content.push(cfg.cliente);
    if (cfg.extraTop)
        doc.content.push(cfg.extraTop);
    doc.content.push(cfg.detalle);
}
async function buildBaseCommon(xmlNode, fechaAutorizacion, env, extra) {
    const tenant = env.findTenant(xmlNode.infoTributaria[0].ruc[0], xmlNode.infoTributaria[0].estab[0], xmlNode.infoTributaria[0].ptoEmi[0]);
    const databaseInfo = tenant && {
        subsidio: tenant.subsidio,
        imgWidth: tenant.logo && tenant.logo.width
    };
    const imgSrc = loadLogo(tenant && tenant.logo && tenant.logo.path);
    const ambiente = xmlNode.infoTributaria[0].ambiente[0] == '1' ? 'PRUEBA' : 'PRODUCCIÓN';
    const tipoEmision = xmlNode.infoTributaria[0].tipoEmision[0] == '1' ? 'NORMAL' : '';
    const barcode = await env.getBarcode(xmlNode.infoTributaria[0].claveAcceso[0]);
    const leyenda_catastro = env.getLeyendaCatastro(xmlNode);
    return {
        tenant,
        databaseInfo,
        imgSrc,
        ambiente,
        tipoEmision,
        barcode,
        leyenda_catastro,
        fechaAutorizacionFmt: moment(fechaAutorizacion, 'YYYY-MM-DDTHH:mm:ss').add(-5, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        ...extra
    };
}
function cabeceras(c, node, titulo, info, opts = {}) {
    const it = node.infoTributaria[0];
    const databaseInfo = c.databaseInfo || { imgWidth: '50%' };
    return {
        header: {
            imgSrc: c.imgSrc,
            imgWidth: databaseInfo.imgWidth,
            nombreComercial: g(it, 'nombreComercial', g(it, 'razonSocial')),
            ruc: it.ruc[0],
            titulo,
            secuencial: `${it.estab[0]}-${it.ptoEmi[0]}-${it.secuencial[0]}`
        },
        empresa: {
            razonSocial: g(it, 'razonSocial'),
            matrizDir: g(it, 'dirMatriz'),
            estab: it.estab[0],
            sucDir: g(info, 'dirEstablecimiento'),
            contribuyenteEspecial: opts.contribuyenteEspecial === undefined ? g(info, 'contribuyenteEspecial') : opts.contribuyenteEspecial,
            obligadoContabilidad: g(info, 'obligadoContabilidad'),
            leyendaCatastro: c.leyenda_catastro,
            claveAcceso: it.claveAcceso[0],
            fechaAutorizacion: c.fechaAutorizacionFmt,
            ambiente: c.ambiente,
            tipoEmision: c.tipoEmision,
            barcode: c.barcode
        }
    };
}
function detalleConTotales({ widths, header, rows, infoStack, totales, extraPie }) {
    const stack = [
        {
            table: { widths, headerRows: 1, body: [header, ...rows] },
            layout: lineLight(),
            margin: [0, 0, 0, 0]
        }
    ];
    if (extraPie)
        stack.push(extraPie);
    stack.push({
        margin: [0, 6, 0, 0],
        columns: [
            { width: '*', stack: infoStack, margin: [0, 0, 10, 0] },
            {
                width: 210,
                table: { widths: ['*', 70], body: totales },
                layout: lineLight(0.6, '#dddddd', [4, 3, 4, 3])
            }
        ]
    });
    return { stack };
}
function resultado(doc, node, c) {
    return { doc, clave: node.infoTributaria[0].claveAcceso[0], tenant: c.tenant };
}
function formasPago(info, env) {
    const pagos = info.pagos && info.pagos[0] && info.pagos[0].pago ? info.pagos[0].pago : [];
    if (!pagos.length)
        return null;
    const body = [[{ text: 'Forma de pago:', color: COLOR_AZUL, bold: true, colSpan: 2, fontSize: 7.5 }, {}]];
    pagos.forEach((i) => {
        body.push([
            { text: text(env.sri.formaPago[i.formaPago[0]]), fontSize: 7 },
            { text: '$ ' + text(i.total[0]), alignment: 'right', fontSize: 7 }
        ]);
    });
    return {
        margin: [0, 6, 0, 0],
        table: { widths: ['*', 70], body },
        layout: lineLight(0.6, '#dddddd', [4, 3, 4, 3])
    };
}
function ridePrefs(env, databaseInfo) {
    const opt = env.RIDE.optionalItems;
    return {
        detAdicional: opt.detAdicional.status ? opt.detAdicional.mode : -1,
        detAdicNames: opt.detAdicional.names || [],
        hasCodAux: !!opt.codigoAuxiliar,
        propina: opt.propina,
        hasSubsidio: !!(databaseInfo && databaseInfo.subsidio && databaseInfo.subsidio.status)
    };
}
function extrasDescripcion(node, prefs) {
    if (prefs.detAdicional !== 1)
        return [];
    const dets = node.detalles[0].detalle;
    const last = dets[dets.length - 1];
    if (last && last.detallesAdicionales) {
        return [{ $: { nombre: 'Descripcion' }, _: last.detallesAdicionales[0].detAdicional[0]['$'].valor }];
    }
    return [];
}
export async function buildFactura(factura, fechaAutorizacion, env) {
    const c = await buildBaseCommon(factura, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = factura.infoFactura[0];
    const databaseInfo = c.databaseInfo || { subsidio: { status: false } };
    const prefs = ridePrefs(env, databaseInfo);
    const N = env.RIDE.name;
    const widths = ['9%'];
    const header = [thead(N.codigoPrincipal)];
    if (prefs.hasCodAux) {
        widths.push('10%');
        header.push(thead(N.codigoAuxiliar));
    }
    widths.push('*');
    header.push(thead(N.descripcion));
    widths.push('8%');
    header.push(thead(N.cantidad));
    widths.push('10%');
    header.push(thead(N.precioUnitario));
    if (prefs.detAdicional == 0) {
        prefs.detAdicNames.forEach((n) => { widths.push('auto'); header.push(thead(n)); });
    }
    if (prefs.hasSubsidio) {
        widths.push('auto');
        header.push(thead(databaseInfo.subsidio.label.subsidio));
        widths.push('auto');
        header.push(thead(databaseInfo.subsidio.label.precio_sin_subsidio));
    }
    widths.push('8%');
    header.push(thead(N.descuento));
    widths.push('11%');
    header.push(thead(N.precioTotal));
    let totalSubsidio = 0;
    const detalles = factura.detalles[0].detalle;
    const rows = detalles.map((i) => {
        const r = [td(i.codigoPrincipal[0], { alignment: 'center', fontSize: 7 })];
        if (prefs.hasCodAux)
            r.push(td(i.codigoAuxiliar ? i.codigoAuxiliar[0] : '', { fontSize: 7 }));
        r.push(td(i.descripcion[0], { fontSize: 7.5 }));
        r.push(td(num(i.cantidad).toFixed(2), { alignment: 'center' }));
        r.push(tdMoney(num(i.precioUnitario)));
        if (prefs.detAdicional == 0) {
            for (let j = 0; j < prefs.detAdicNames.length; j++) {
                const d = i.detallesAdicionales && i.detallesAdicionales[0].detAdicional[j];
                r.push(td(d ? d['$'].valor : '', { fontSize: 7 }));
            }
        }
        if (prefs.hasSubsidio) {
            const sinSub = num(i.precioSinSubsidio);
            const sub = num(i.precioUnitario) * num(i.cantidad) - sinSub;
            totalSubsidio += sub;
            r.push(tdNum(sub.toFixed(6)));
            r.push(tdNum(sinSub.toFixed(2)));
        }
        r.push(tdNum(num(i.descuento).toFixed(2)));
        r.push(tdMoney(num(i.precioTotalSinImpuesto) + num(i.descuento)));
        return r;
    });
    if (prefs.detAdicional == 2) {
        const last = detalles[detalles.length - 1];
        if (last && last.detallesAdicionales) {
            const cells = [td(last.detallesAdicionales[0].detAdicional[0]['$'].valor, { colSpan: widths.length, alignment: 'center', fontSize: 7 })];
            for (let k = 1; k < widths.length; k++)
                cells.push({});
            rows.push(cells);
        }
    }
    const getValor = (v) => (Array.isArray(v) ? v[0] : v);
    const getPorcentajeIVA = (codigoPorcentaje) => {
        const cod = String(getValor(codigoPorcentaje));
        let porcentaje = getItem(env.sri.codigoIVA, 'codigo', cod, 'porcentaje');
        if (porcentaje === undefined || porcentaje === null || porcentaje === '' || porcentaje === -1) {
            porcentaje = env.sri.tarifaIVA ? env.sri.tarifaIVA[cod] : '';
        }
        return porcentaje !== undefined && porcentaje !== null && porcentaje !== '' ? porcentaje : cod;
    };
    const impuestos = (info.totalConImpuestos && info.totalConImpuestos[0].totalImpuesto) || [];
    let subtotal = 0;
    let subtotalnoi = 0;
    let ice = 0;
    detalles.forEach((i) => { subtotal += num(i.cantidad) * num(i.precioUnitario); });
    impuestos.forEach((i) => {
        const codigoImp = String(getValor(i.codigo));
        const codigoPorcentaje = String(getValor(i.codigoPorcentaje));
        if (codigoImp === '2' && codigoPorcentaje === '6')
            subtotalnoi += num(getValor(i.baseImponible));
        if (codigoImp === '3')
            ice += num(getValor(i.valor));
    });
    const totales = [];
    impuestos.forEach((i) => {
        if (String(getValor(i.codigo)) === '2') {
            totales.push(totalRow('SUBTOTAL ' + getPorcentajeIVA(i.codigoPorcentaje) + '%', num(getValor(i.baseImponible))));
        }
    });
    if (prefs.propina.status)
        totales.push(totalRow(prefs.propina.name, num(info.propina)));
    totales.push(totalRow('SUBTOTAL NO OBJETO DE IVA', subtotalnoi));
    totales.push(totalRow('SUBTOTAL SIN IMPUESTO', num(info.totalSinImpuestos)));
    totales.push(totalRow('SUBTOTAL SIN DESCUENTO', subtotal));
    totales.push(totalRow('TOTAL DESCUENTO', num(info.totalDescuento)));
    totales.push(totalRow('ICE', ice));
    impuestos.forEach((i) => {
        if (String(getValor(i.codigo)) === '2') {
            totales.push(totalRow('IVA ' + getPorcentajeIVA(i.codigoPorcentaje) + ' %', num(getValor(i.valor))));
        }
    });
    totales.push(totalRow('TOTAL', text(info.importeTotal[0]), true));
    if (prefs.hasSubsidio) {
        const total = num(info.importeTotal);
        totales.push(totalRow(databaseInfo.subsidio.label.valor_total_sin_subsidio, total + totalSubsidio));
        totales.push(totalRow(databaseInfo.subsidio.label.ahorro_subsidio, totalSubsidio));
    }
    const { header: hdr, empresa } = cabeceras(c, factura, 'F A C T U R A', info, {
        contribuyenteEspecial: info.contribuyenteEspecial ? info.contribuyenteEspecial[0] : ''
    });
    const pagos = formasPago(info, env);
    const direccionComprador = info.direccionComprador ? info.direccionComprador[0] : '';
    const placa = info.placa ? info.placa[0] : '';
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', info.razonSocialComprador[0]]],
            [['RUC / CI: ', info.identificacionComprador[0]], ['Fecha: ', info.fechaEmision[0]]],
            [['Dirección: ', direccionComprador]],
            [['Placa: ', placa]]
        ]),
        detalle: detalleConTotales({
            widths,
            header,
            rows,
            infoStack: infoAdicionalStack(factura, extrasDescripcion(factura, prefs)),
            totales,
            extraPie: pagos
        })
    });
    return resultado(doc, factura, c);
}
const RETENCION_HEADER = ['COMPROBANTE', 'NÚMERO', 'FECHA EMISIÓN', 'EJERCICIO FISCAL', 'BASE IMPONIBLE', 'IMPUESTO', 'PORCENTAJE DE RETENCIÓN', 'VALOR RETENIDO'];
async function buildRetencionBase(comprobanteRetencion, fechaAutorizacion, env, useDocsSustento) {
    const c = await buildBaseCommon(comprobanteRetencion, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = comprobanteRetencion.infoCompRetencion[0];
    const periodo = g(info, 'periodoFiscal');
    const nombreDoc = (cod) => (typeof env.sri.codDocSustento[cod] === 'undefined' ? 'OTROS' : env.sri.codDocSustento[cod]);
    const lineas = [];
    if (useDocsSustento) {
        const docs = (comprobanteRetencion.docsSustento && comprobanteRetencion.docsSustento[0].docSustento) || [];
        docs.forEach((d) => {
            const rets = (d.retenciones && d.retenciones[0].retencion) || [];
            rets.forEach((r) => lineas.push({ cod: g(d, 'codDocSustento'), num: g(d, 'numDocSustento'), fecha: g(d, 'fechaEmisionDocSustento'), r }));
        });
    }
    else {
        const imps = (comprobanteRetencion.impuestos && comprobanteRetencion.impuestos[0].impuesto) || [];
        imps.forEach((r) => lineas.push({ cod: g(r, 'codDocSustento'), num: g(r, 'numDocSustento'), fecha: g(r, 'fechaEmisionDocSustento'), r }));
    }
    let total = 0;
    const rows = lineas.map(({ cod, num: numDoc, fecha, r }) => {
        total += num(r.valorRetenido);
        return [
            td(nombreDoc(cod)),
            td(numDoc),
            td(fecha, { alignment: 'center' }),
            td(periodo, { alignment: 'center' }),
            tdNum('$ ' + text(r.baseImponible[0])),
            td(env.sri.codImpuestoRetencion[r.codigo[0]], { alignment: 'center' }),
            tdNum(text(r.porcentajeRetener[0])),
            tdNum('$ ' + text(r.valorRetenido[0]))
        ];
    });
    const { header: hdr, empresa } = cabeceras(c, comprobanteRetencion, 'COMPROBANTE DE RETENCIÓN', info);
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', g(info, 'razonSocialSujetoRetenido')]],
            [['RUC / CI: ', g(info, 'identificacionSujetoRetenido')], ['Fecha Emisión: ', g(info, 'fechaEmision')]],
            [['Dirección: ', g(info, 'direccionSujetoRetenido')]]
        ]),
        detalle: detalleConTotales({
            widths: ['16%', '16%', '10%', '9%', '12%', '9%', '14%', '14%'],
            header: RETENCION_HEADER.map((h) => thead(h)),
            rows,
            infoStack: infoAdicionalStack(comprobanteRetencion),
            totales: [totalRow('TOTAL DE RETENCIÓN: ', total.toFixed(2), true)]
        })
    });
    return resultado(doc, comprobanteRetencion, c);
}
export function buildRetencion(c, f, env) { return buildRetencionBase(c, f, env, false); }
export function buildRetencion2(c, f, env) { return buildRetencionBase(c, f, env, true); }
export async function buildCredito(notaCredito, fechaAutorizacion, env) {
    const c = await buildBaseCommon(notaCredito, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = notaCredito.infoNotaCredito[0];
    const ivas = (info.totalConImpuestos && info.totalConImpuestos[0].totalImpuesto) || [];
    const rows = notaCredito.detalles[0].detalle.map((i) => [
        td(g(i, 'codigoInterno')),
        td(g(i, 'codigoAdicional')),
        td(g(i, 'descripcion')),
        td(g(i, 'cantidad'), { alignment: 'center' }),
        tdNum('$ ' + g(i, 'precioUnitario')),
        tdNum('$ ' + g(i, 'precioTotalSinImpuesto'))
    ]);
    const totales = [totalRow('SUBTOTAL', g(info, 'totalSinImpuestos', '0.00'))];
    ivas.forEach((i) => totales.push(totalRow('IVA ' + text(env.sri.tarifaIVA[i.codigoPorcentaje[0]]), text(i.valor[0]))));
    totales.push(totalRow('VALOR TOTAL: ', g(info, 'valorModificacion', '0.00'), true));
    const { header: hdr, empresa } = cabeceras(c, notaCredito, 'NOTA DE CRÉDITO', info);
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', g(info, 'razonSocialComprador')]],
            [['RUC / CI: ', g(info, 'identificacionComprador')], ['Fecha Emisión: ', g(info, 'fechaEmision')]],
            [['Dirección: ', g(info, 'direccionComprador')]],
            [['Comprobante que se modifica: ', (env.sri.codDocSustento[g(info, 'codDocModificado')] || '') + ' | ' + g(info, 'numDocModificado')]],
            [['Fecha emisión (Comprobante a modificar): ', g(info, 'fechaEmisionDocSustento')]],
            [['Razón de modificación: ', g(info, 'motivo')]]
        ]),
        detalle: detalleConTotales({
            widths: ['12%', '12%', '*', '9%', '13%', '14%'],
            header: ['COD', 'COD. AUX.', 'DESCRIPCIÓN', 'CANT.', 'P. UNITARIO', 'TOTAL ÍTEM'].map((h) => thead(h)),
            rows,
            infoStack: infoAdicionalStack(notaCredito),
            totales
        })
    });
    return resultado(doc, notaCredito, c);
}
export async function buildDebito(notaDebito, fechaAutorizacion, env) {
    const c = await buildBaseCommon(notaDebito, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = notaDebito.infoNotaDebito[0];
    const ivas = (info.impuestos && info.impuestos[0].impuesto) || [];
    const motivos = (notaDebito.motivos && notaDebito.motivos[0].motivo) || [];
    let total = 0;
    const rows = motivos.map((i) => {
        total += num(i.valor);
        return [td(g(i, 'razon')), tdNum('$ ' + g(i, 'valor'))];
    });
    const totales = [totalRow('SUBTOTAL', g(info, 'totalSinImpuestos', '0.00'))];
    ivas.forEach((i) => totales.push(totalRow('IVA ' + text(env.sri.tarifaIVA[i.codigoPorcentaje[0]]), text(i.valor[0]))));
    totales.push(totalRow('VALOR TOTAL: ', total.toFixed(2), true));
    const { header: hdr, empresa } = cabeceras(c, notaDebito, 'NOTA DE DÉBITO', info);
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', g(info, 'razonSocialComprador')]],
            [['RUC / CI: ', g(info, 'identificacionComprador')], ['Fecha Emisión: ', g(info, 'fechaEmision')]],
            [['Dirección: ', g(info, 'direccionComprador')]],
            [['Comprobante que se modifica: ', (env.sri.codDocSustento[g(info, 'codDocModificado')] || '') + ' | ' + g(info, 'numDocModificado')]],
            [['Fecha emisión (Comprobante a modificar): ', g(info, 'fechaEmisionDocSustento')]]
        ]),
        detalle: detalleConTotales({
            widths: ['*', 90],
            header: ['RAZÓN DE LA MODIFICACIÓN', 'VALOR'].map((h) => thead(h)),
            rows,
            infoStack: infoAdicionalStack(notaDebito),
            totales
        })
    });
    return resultado(doc, notaDebito, c);
}
export async function buildRemision(guiaRemision, fechaAutorizacion, env) {
    const c = await buildBaseCommon(guiaRemision, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = guiaRemision.infoGuiaRemision[0];
    const { header: hdr, empresa } = cabeceras(c, guiaRemision, 'GUÍA DE REMISIÓN', info, { contribuyenteEspecial: '' });
    const destinatarios = [];
    const dests = (guiaRemision.destinatarios && guiaRemision.destinatarios[0].destinatario) || [];
    dests.forEach((i) => {
        const codDoc = i.codDocSustento ? env.sri.codDocSustento[i.codDocSustento[0]] : '';
        destinatarios.push({
            margin: [0, 0, 0, 6],
            unbreakable: false,
            stack: [
                clienteBox([
                    [['Tipo: ', codDoc], ['Fecha de Emisión: ', g(i, 'fechaEmisionDocSustento')]],
                    [['Autorización: ', g(i, 'numAutDocSustento')], ['Secuencial: ', g(i, 'numDocSustento')]],
                    [['Destinatario: ', g(i, 'razonSocialDestinatario')], ['RUC/CI: ', g(i, 'identificacionDestinatario')]],
                    [['Dirección Destinatario: ', g(i, 'dirDestinatario')]],
                    [['Ruta: ', g(i, 'ruta')], ['Motivo: ', g(i, 'motivoTraslado')]]
                ]),
                {
                    table: {
                        widths: ['20%', '*', '14%'],
                        headerRows: 1,
                        body: [
                            ['CÓDIGO INTERNO', 'DESCRIPCIÓN', 'CANTIDAD'].map((h) => thead(h)),
                            ...((i.detalles && i.detalles[0].detalle) || []).map((j) => [td(g(j, 'codigoInterno')), td(g(j, 'descripcion')), td(g(j, 'cantidad'), { alignment: 'center' })])
                        ]
                    },
                    layout: lineLight()
                }
            ]
        });
    });
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', g(info, 'razonSocialTransportista')]],
            [['RUC / CI: ', g(info, 'rucTransportista')], ['Placa: ', g(info, 'placa')]],
            [['Dirección de Partida: ', g(info, 'dirPartida')]],
            [['Fecha de Inicio: ', g(info, 'fechaIniTransporte')], ['Fecha de Fin: ', g(info, 'fechaFinTransporte')]]
        ]),
        detalle: {
            stack: [
                ...destinatarios,
                { margin: [0, 6, 0, 0], stack: infoAdicionalStack(guiaRemision) }
            ]
        }
    });
    return resultado(doc, guiaRemision, c);
}
export async function buildLiquidacion(liquidacionCompra, fechaAutorizacion, env) {
    const c = await buildBaseCommon(liquidacionCompra, fechaAutorizacion, env, {});
    const doc = baseDocDef();
    const info = liquidacionCompra.infoLiquidacionCompra[0];
    const prefs = ridePrefs(env, c.databaseInfo);
    const N = env.RIDE.name;
    const widths = ['10%'];
    const header = [thead(N.codigoPrincipal)];
    if (prefs.hasCodAux) {
        widths.push('9%');
        header.push(thead(N.codigoAuxiliar));
    }
    widths.push('*');
    header.push(thead(N.descripcion));
    if (prefs.detAdicional == 0) {
        prefs.detAdicNames.forEach((n) => { widths.push('auto'); header.push(thead(n)); });
    }
    widths.push('8%');
    header.push(thead(N.cantidad));
    widths.push('12%');
    header.push(thead(N.precioUnitario));
    widths.push('12%');
    header.push(thead(N.precioTotal));
    const detalles = liquidacionCompra.detalles[0].detalle;
    const rows = detalles.map((i) => {
        const r = [td(i.codigoPrincipal[0], { alignment: 'center', fontSize: 7 })];
        if (prefs.hasCodAux)
            r.push(td(i.codigoAuxiliar ? i.codigoAuxiliar[0] : '', { fontSize: 7 }));
        r.push(td(i.descripcion[0]));
        if (prefs.detAdicional == 0) {
            for (let j = 0; j < prefs.detAdicNames.length; j++) {
                const d = i.detallesAdicionales && i.detallesAdicionales[0].detAdicional[j];
                r.push(td(d ? d['$'].valor : '', { fontSize: 7 }));
            }
        }
        r.push(td(num(i.cantidad).toFixed(2), { alignment: 'center' }));
        r.push(tdMoney(num(i.precioUnitario)));
        r.push(tdMoney(num(i.precioTotalSinImpuesto) + num(i.descuento)));
        return r;
    });
    let subtotal12 = 0;
    let subtotal0 = 0;
    let iva = 0;
    let ice = 0;
    ((info.totalConImpuestos && info.totalConImpuestos[0].totalImpuesto) || []).forEach((i) => {
        if (i.codigo == '2' && i.codigoPorcentaje == '2') {
            iva = num(i.valor);
            subtotal12 = num(i.baseImponible);
        }
        else if (i.codigo == '2')
            subtotal0 = num(i.baseImponible);
        else if (i.codigo == '3')
            ice = num(i.baseImponible);
    });
    const totales = [totalRow('SUBTOTAL(0%)', subtotal0)];
    if (prefs.propina.status)
        totales.push(totalRow(prefs.propina.name, num(info.propina)));
    totales.push(totalRow('SUBTOTAL(12%)', subtotal12));
    totales.push(totalRow('DESCUENTO', g(info, 'totalDescuento', '0.00')));
    totales.push(totalRow('IVA', iva));
    totales.push(totalRow('ICE', ice));
    totales.push(totalRow('TOTAL', g(info, 'importeTotal', '0.00'), true));
    const { header: hdr, empresa } = cabeceras(c, liquidacionCompra, 'LIQUIDACIÓN DE COMPRA', info);
    pushRideBase(doc, {
        header: hdr,
        empresa,
        cliente: clienteBox([
            [['Razón Social / Nombres y Apellidos: ', g(info, 'razonSocialProveedor')]],
            [['RUC / CI: ', g(info, 'identificacionProveedor')], ['Fecha Emisión: ', g(info, 'fechaEmision')]],
            [['Dirección: ', g(info, 'direccionProveedor')]]
        ]),
        detalle: detalleConTotales({
            widths,
            header,
            rows,
            infoStack: infoAdicionalStack(liquidacionCompra, extrasDescripcion(liquidacionCompra, prefs)),
            totales,
            extraPie: formasPago(info, env)
        })
    });
    return resultado(doc, liquidacionCompra, c);
}
//# sourceMappingURL=ride-builders.js.map