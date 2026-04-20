const PdfPrinter = require('pdfmake');
const moment = require('moment');
const params = require('./params');
const utilities = require('./utilities');

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
const printer = new PdfPrinter(fonts);

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
  if (!cfg) return 130;
  const s = String(cfg);
  if (s.endsWith('%')) {
    const pct = parseFloat(s);
    if (isNaN(pct)) return 130;
    return Math.round(260 * (pct / 100));
  }
  const n = parseFloat(s);
  return isNaN(n) ? 130 : n;
}

function loadLogo(rawPath) {
  const path = require('path');
  const fs = require('fs');
  if (!rawPath) return '';
  try {
    const logoPath = path.normalize(rawPath);
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      return 'data:image/jpeg;base64,' + logoBase64;
    }
  } catch (e) {
    console.error('Error leyendo logo:', e.message);
  }
  return '';
}

function writeStream(docDefinition, filePath, onDone, onError) {
  const fs = require('fs');
  const doc = printer.createPdfKitDocument(docDefinition);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  stream.on('finish', onDone);
  stream.on('error', onError);
  doc.end();
}

function rideBanner() {
  return {
    margin: [0, 0, 0, 10],
    layout: noBorders([0, 0, 0, 0]),
    table: {
      widths: ['*'],
      body: [[{
        text: 'REPRESENTACIÓN IMPRESA DOCUMENTO ELECTRÓNICO (RIDE)',
        alignment: 'center',
        bold: true,
        color: 'white',
        fillColor: '#1b4ea3',
        fontSize: 12,
        margin: [4, 5, 4, 5]
      }]]
    }
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
                ]
              }]]
            },
            layout: outerOnlyBoxLayout()
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

function buildCliente4Cols(rows) {
  return {
    margin: [0, 0, 0, 8],
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: rows
    },
    layout: outerOnlyBoxLayout()
  };
}

function thead(texto) {
  return { text: texto, bold: true, color: 'white', fillColor: COLOR_AZUL, alignment: 'center', fontSize: 7.5, margin: [0, 2, 0, 2] };
}

function td(v, extra) {
  return Object.assign({ text: text(v), fontSize: 7 }, extra || {});
}

function tdNum(v, extra) {
  return Object.assign({ text: text(v), fontSize: 7, alignment: 'right' }, extra || {});
}

function tdMoney(v, extra) {
  return Object.assign({ text: money(v), fontSize: 7, alignment: 'right' }, extra || {});
}

function infoAdditionalText(node) {
  let out = '';
  if (node && node.infoAdicional && node.infoAdicional[0] && node.infoAdicional[0].campoAdicional) {
    node.infoAdicional[0].campoAdicional.forEach(i => {
      out += '-' + text(i['$'] && i['$'].nombre) + ':\n' + text(i['_']) + '\n';
    });
  }
  return out.trim();
}

function renderDoc(doc, clave, res) {
  const fs = require('fs');
  const filePath = clave + '.pdf';
  writeStream(doc, filePath, () => {
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch (e) { } }, 30000);
    res.send(filePath);
  }, () => res.status(500).send());
}

function pushRideBase(doc, cfg) {
  doc.content.push(rideBanner());
  doc.content.push(buildTopHeader(cfg.header));
  doc.content.push(buildEmpresaAutorizacionOldStyle(cfg.empresa));
  doc.content.push(cfg.cliente);
  if (cfg.extraTop) doc.content.push(cfg.extraTop);
  doc.content.push(cfg.detalle);
}

async function buildBaseCommon(xmlNode, fechaAutorizacion, getInfo, extra) {
  const databaseInfo = utilities.getDatabaseInfoByRuc(
    xmlNode.infoTributaria[0].ruc[0],
    xmlNode.infoTributaria[0].estab[0],
    xmlNode.infoTributaria[0].ptoEmi[0]
  );
  const imgSrc = loadLogo(utilities.getLogoByRuc(
    xmlNode.infoTributaria[0].ruc[0],
    xmlNode.infoTributaria[0].estab[0],
    xmlNode.infoTributaria[0].ptoEmi[0]
  ));
  const ambiente = xmlNode.infoTributaria[0].ambiente[0] == '1' ? 'PRUEBA' : 'PRODUCCIÓN';
  const tipoEmision = xmlNode.infoTributaria[0].tipoEmision[0] == '1' ? 'NORMAL' : '';
  const barcode = await utilities.getBarcode(xmlNode.infoTributaria[0].claveAcceso[0]);
  const leyenda_catastro = utilities.getLeyendaCatastro(xmlNode);
  return {
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

// ---------------- FACTURA ----------------
async function renderFactura(factura, fechaAutorizacion, res) {
  const c = await buildBaseCommon(factura, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo;
  const direccionComprador = factura.infoFactura[0].direccionComprador ? factura.infoFactura[0].direccionComprador[0] : '';
  const contribuyenteEspecial = factura.infoFactura[0].contribuyenteEspecial ? factura.infoFactura[0].contribuyenteEspecial[0] : '';
  const placa = factura.infoFactura[0].placa ? factura.infoFactura[0].placa[0] : '';
  const detAdicional = params.RIDE.optionalItems.detAdicional.status ? params.RIDE.optionalItems.detAdicional.mode : -1;
  const hasCodAux = params.RIDE.optionalItems.codigoAuxiliar;
  const hasDetAdic0 = detAdicional == 0;
  const detAdicNames = params.RIDE.optionalItems.detAdicional.names;
  const hasSubsidio = databaseInfo.subsidio.status;

  const detalleWidths = ['9%'];
  const detalleHeader = [thead(params.RIDE.name.codigoPrincipal)];
  if (hasCodAux) { detalleWidths.push('10%'); detalleHeader.push(thead(params.RIDE.name.codigoAuxiliar)); }
  detalleWidths.push('54%'); detalleHeader.push(thead(params.RIDE.name.descripcion));
  detalleWidths.push('8%'); detalleHeader.push(thead(params.RIDE.name.cantidad));
  detalleWidths.push('10%'); detalleHeader.push(thead(params.RIDE.name.precioUnitario));
  if (hasDetAdic0) detAdicNames.forEach(n => { detalleWidths.push('auto'); detalleHeader.push(thead(n)); });
  if (hasSubsidio) {
    detalleWidths.push('auto'); detalleHeader.push(thead(databaseInfo.subsidio.label.subsidio));
    detalleWidths.push('auto'); detalleHeader.push(thead(databaseInfo.subsidio.label.precio_sin_subsidio));
  }
  detalleWidths.push('8%'); detalleHeader.push(thead(params.RIDE.name.descuento));
  detalleWidths.push('11%'); detalleHeader.push(thead(params.RIDE.name.precioTotal));

  const detBody = [detalleHeader];
  let totalSubsidio = 0;

  factura.detalles[0].detalle.forEach(i => {
    const precioUnitario = parseFloat(i.precioUnitario[0] || 0);
    const cantidad = parseFloat(i.cantidad[0] || 0);
    const row = [td(i.codigoPrincipal[0], { alignment: 'center' })];
    if (hasCodAux) row.push(td(i.codigoAuxiliar ? i.codigoAuxiliar[0] : ''));
    row.push(td(i.descripcion[0]));
    row.push(tdNum(cantidad.toFixed(2), { alignment: 'center' }));
    row.push(tdMoney(precioUnitario));

    if (hasDetAdic0) {
      for (let j = 0; j < detAdicNames.length; j++) {
        const val = i.detallesAdicionales && i.detallesAdicionales[0].detAdicional[j]
          ? i.detallesAdicionales[0].detAdicional[j]['$'].valor
          : '';
        row.push(td(val));
      }
    }

    if (hasSubsidio) {
      const precioSinSubsidio = parseFloat(i.precioSinSubsidio[0] || 0);
      const subsidio = precioUnitario * cantidad - precioSinSubsidio;
      totalSubsidio += subsidio;
      row.push(tdNum(subsidio.toFixed(6)));
      row.push(tdNum(precioSinSubsidio.toFixed(2)));
    }

    row.push(tdNum(parseFloat(i.descuento[0] || 0).toFixed(2)));
    row.push(tdMoney(parseFloat(i.precioTotalSinImpuesto[0] || 0) + parseFloat(i.descuento[0] || 0)));
    detBody.push(row);
  });

  if (detAdicional == 2) {
    const last = factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1];
    if (last.detallesAdicionales) {
      const obs = last.detallesAdicionales[0].detAdicional[0]['$'].valor;
      const row = new Array(detalleWidths.length).fill({ text: '' });
      row[0] = { text: obs, colSpan: detalleWidths.length, alignment: 'center', fontSize: 7 };
      for (let k = 1; k < detalleWidths.length; k++) row[k] = {};
      detBody.push(row);
    }
  }


  let subtotal = 0;
  let subtotalNoObjetoIva = 0;
  let ice = 0;

  factura.detalles[0].detalle.forEach(i => {
    subtotal += parseFloat(i.cantidad[0] || 0) * parseFloat(i.precioUnitario[0] || 0);
  });

  const totalImpuestos = factura.infoFactura[0].totalConImpuestos[0].totalImpuesto || [];

  // Acumuladores fijos
  const resumenIva = {
    '15': { base: 0, valor: 0 },
    '5': { base: 0, valor: 0 },
    '0': { base: 0, valor: 0 }
  };
  totalImpuestos.forEach(i => {
    const codigo = String(i.codigo || '');
    const codigoPorcentaje = String(i.codigoPorcentaje || '');
    const base = parseFloat(i.baseImponible || 0);
    const valor = parseFloat(i.valor || 0);

    // IVA
    if (codigo === '2') {
      const porcentajeNombre = String(
        params.getItem(params.sri.codigoIVA, 'codigo', codigoPorcentaje, 'porcentaje') || ''
      ).replace('%', '').trim();

      if (porcentajeNombre === '15') {
        resumenIva['15'].base += base;
        resumenIva['15'].valor += valor;
      } else if (porcentajeNombre === '5') {
        resumenIva['5'].base += base;
        resumenIva['5'].valor += valor;
      } else if (porcentajeNombre === '0' || codigoPorcentaje === '0') {
        resumenIva['0'].base += base;
        resumenIva['0'].valor += valor;
      } else {
        // si quieres puedes sumar aquí a no objeto o crear otra fila
        resumenIva['0'].base += base;
        resumenIva['0'].valor += valor;
      }
    }

    // ICE
    if (codigo === '3') {
      ice += valor;
    }
  });
  // Totales base
  const subtotal15 = resumenIva['15'].base;
  const subtotal5 = resumenIva['5'].base;
  const subtotal0 = resumenIva['0'].base;

  const iva15 = resumenIva['15'].valor;
  const iva5 = resumenIva['5'].valor;
  const iva0 = resumenIva['0'].valor;

  const subtotalSinImpuesto = subtotal - parseFloat(factura.infoFactura[0].totalDescuento[0] || 0);
  const subtotalSinDescuento = subtotal;
  const totalDescuento = parseFloat(factura.infoFactura[0].totalDescuento[0] || 0);


  if (detAdicional == 1) {
    const last = factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1];
    if (last.detallesAdicionales) {
      const obs = { $: { nombre: 'Descripcion' }, _: last.detallesAdicionales[0].detAdicional[0]['$'].valor };
      if (factura.infoAdicional) factura.infoAdicional[0].campoAdicional.push(obs);
      else factura.infoAdicional = [{ campoAdicional: [obs] }];
    }
  }

  const infoAd = infoAdditionalText(factura);
  const cs = detalleWidths.length;

  const labelSpan = cs - 2;

  const infoSpan = Math.max(1, cs - 4);

  const totalLabelSpan = 3;

  function totalRow(label, value, opts = {}) {
    const row = new Array(cs).fill({ text: '' });

    for (let k = 0; k < infoSpan; k++) row[k] = {};

    row[infoSpan] = {
      text: label,
      colSpan: totalLabelSpan,
      fillColor: BG_TOTAL,
      fontSize: 8,
      bold: !!opts.bold
    };

    row[infoSpan + 1] = {};
    row[infoSpan + 2] = {};

    row[cs - 1] = {
      text: money(value),
      fillColor: BG_TOTAL,
      fontSize: 8,
      alignment: 'right',
      bold: !!opts.bold
    };

    return row;
  }

  const filasTotales = [
    ['SUBTOTAL 15%', subtotal15],
    ['SUBTOTAL 5%', subtotal5],
    ['SUBTOTAL 0%', subtotal0],
    ['SUBTOTAL NO OBJETO DE IVA', subtotalNoObjetoIva],
    ['SUBTOTAL SIN IMPUESTO', subtotalSinImpuesto],
    ['SUBTOTAL SIN DESCUENTO', subtotalSinDescuento],
    ['TOTAL DESCUENTO', totalDescuento],
    ['ICE', ice],
    ['IVA 15%', iva15],
    ['IVA 5%', iva5],
    ['IVA 0%', iva0]
  ];

  if (params.RIDE.optionalItems.propina.status) {
    filasTotales.push([
      params.RIDE.optionalItems.propina.name,
      parseFloat(factura.infoFactura[0].propina[0] || 0)
    ]);
  }

  filasTotales.push([
    'TOTAL',
    parseFloat(factura.infoFactura[0].importeTotal[0] || 0),
    true
  ]);

  const infoRow = new Array(cs).fill({ text: '' });
  infoRow[0] = {
    text: infoAd || 'Información Adicional',
    colSpan: infoSpan,
    rowSpan: filasTotales.length,
    fontSize: 7,
    color: COLOR_AZUL
  };

  for (let k = 1; k < infoSpan; k++) infoRow[k] = {};

  infoRow[infoSpan] = {
    text: filasTotales[0][0],
    colSpan: totalLabelSpan,
    fillColor: BG_TOTAL,
    fontSize: 8,
    bold: !!filasTotales[0][2]
  };

  infoRow[infoSpan + 1] = {};
  infoRow[infoSpan + 2] = {};

  infoRow[cs - 1] = {
    text: money(filasTotales[0][1]),
    fillColor: BG_TOTAL,
    fontSize: 8,
    alignment: 'right',
    bold: !!filasTotales[0][2]
  };

  detBody.push(infoRow);

  for (let i = 1; i < filasTotales.length; i++) {
    detBody.push(totalRow(filasTotales[i][0], filasTotales[i][1], { bold: !!filasTotales[i][2] }));
  }
  const fpHead = new Array(cs).fill({ text: '' });
  fpHead[0] = { text: 'Forma de pago:', colSpan: cs, color: COLOR_AZUL, fontSize: 8, bold: true };
  for (let k = 1; k < cs; k++) fpHead[k] = {};
  detBody.push(fpHead);

  if (factura.infoFactura[0].pagos) {
    factura.infoFactura[0].pagos[0].pago.forEach(i => {
      const r = new Array(cs).fill({ text: '' });
      r[0] = { text: params.sri.formaPago[i.formaPago[0]], colSpan: cs - 1, fontSize: 7 };
      for (let k = 1; k < cs - 1; k++) r[k] = {};
      r[cs - 1] = { text: money(i.total[0]), fillColor: BG_TOTAL, alignment: 'right', fontSize: 8 };
      detBody.push(r);
    });
  }

  if (databaseInfo.subsidio.status) {
    const total = parseFloat(factura.infoFactura[0].importeTotal[0] || 0);
    detBody.push(totalRow(databaseInfo.subsidio.label.valor_total_sin_subsidio, total + totalSubsidio));
    detBody.push(totalRow(databaseInfo.subsidio.label.ahorro_subsidio, totalSubsidio));
  }

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: factura.infoTributaria[0].nombreComercial[0],
      ruc: factura.infoTributaria[0].ruc[0],
      titulo: 'F A C T U R A',
      secuencial: factura.infoTributaria[0].estab[0] + '-' + factura.infoTributaria[0].ptoEmi[0] + '-' + factura.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: factura.infoTributaria[0].razonSocial[0],
      matrizDir: factura.infoTributaria[0].dirMatriz[0],
      estab: factura.infoTributaria[0].estab[0],
      sucDir: factura.infoFactura[0].dirEstablecimiento ? factura.infoFactura[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial,
      ambiente: c.ambiente,
      obligadoContabilidad: factura.infoFactura[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: factura.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: c.fechaAutorizacionFmt,
      barcode: c.barcode
    },
    cliente: buildCliente4Cols([
      [{ text: 'Razón Social / Nombres y Apellidos:', bold: true }, { text: factura.infoFactura[0].razonSocialComprador[0], colSpan: 3 }, {}, {}],
      [{ text: 'RUC / CI:', bold: true }, { text: factura.infoFactura[0].identificacionComprador[0] }, { text: 'Fecha:', bold: true }, { text: factura.infoFactura[0].fechaEmision[0] }],
      [{ text: 'Dirección:', bold: true }, { text: direccionComprador, colSpan: 3 }, {}, {}],
      [{ text: 'Placa:', bold: true }, { text: placa, colSpan: 3 }, {}, {}]
    ]),
    detalle: {
      table: { widths: detalleWidths, headerRows: 1, body: detBody },
      layout: lineLight(),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, factura.infoTributaria[0].claveAcceso[0], res);
}

// ---------------- RETENCION ----------------
async function renderRetencionBase(comprobanteRetencion, fechaAutorizacion, res, useDocsSustento) {
  const c = await buildBaseCommon(comprobanteRetencion, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo;
  if (!comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido)
    comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido = [''];

  const contribuyenteEspecial = comprobanteRetencion.infoCompRetencion[0].contribuyenteEspecial
    ? comprobanteRetencion.infoCompRetencion[0].contribuyenteEspecial[0]
    : '';

  const widths = ['14%', '14%', '12%', '12%', '14%', '12%', '10%', '12%'];
  const detBody = [[
    thead('COMPROBANTE'),
    thead('NÚMERO'),
    thead('FECHA EMISIÓN'),
    thead('EJERCICIO FISCAL'),
    thead('BASE IMPONIBLE'),
    thead('IMPUESTO'),
    thead('% RETENCIÓN'),
    thead('VALOR RETENIDO')
  ]];

  let total = 0;
  if (useDocsSustento) {
    const retenciones = comprobanteRetencion.docsSustento[0].docSustento[0].retenciones[0].retencion;
    const docS = comprobanteRetencion.docsSustento[0].docSustento[0];
    const cod = typeof params.sri.codDocSustento[docS.codDocSustento[0]] === 'undefined' ? 'OTROS' : params.sri.codDocSustento[docS.codDocSustento[0]];
    retenciones.forEach(i => {
      total += parseFloat(i.valorRetenido[0] || 0);
      detBody.push([
        td(cod),
        td(docS.numDocSustento[0]),
        tdNum(docS.fechaEmisionDocSustento[0]),
        tdNum(comprobanteRetencion.infoCompRetencion[0].periodoFiscal[0]),
        tdMoney(i.baseImponible[0]),
        tdNum(params.sri.codImpuestoRetencion[i.codigo[0]]),
        tdNum(i.porcentajeRetener[0]),
        tdMoney(i.valorRetenido[0])
      ]);
    });
  } else {
    comprobanteRetencion.impuestos[0].impuesto.forEach(i => {
      const cod = typeof params.sri.codDocSustento[i.codDocSustento[0]] === 'undefined' ? 'OTROS' : params.sri.codDocSustento[i.codDocSustento[0]];
      total += parseFloat(i.valorRetenido[0] || 0);
      detBody.push([
        td(cod),
        td(i.numDocSustento[0]),
        tdNum(i.fechaEmisionDocSustento[0]),
        tdNum(comprobanteRetencion.infoCompRetencion[0].periodoFiscal[0]),
        tdMoney(i.baseImponible[0]),
        tdNum(params.sri.codImpuestoRetencion[i.codigo[0]]),
        tdNum(i.porcentajeRetener[0]),
        tdMoney(i.valorRetenido[0])
      ]);
    });
  }
  total = total.toFixed(2);

  const infoAdTxt = infoAdditionalText(comprobanteRetencion);
  detBody.push([
    { text: 'Información Adicional', colSpan: 6, color: COLOR_AZUL, fontSize: 8, bold: true }, {}, {}, {}, {}, {},
    { text: 'TOTAL DERETENCIÓN:', fillColor: BG_TOTAL, fontSize: 8 },
    { text: '$ ' + total, fillColor: BG_TOTAL, fontSize: 8, alignment: 'right', bold: true }
  ]);
  detBody.push([
    { text: infoAdTxt, colSpan: 6, fontSize: 7 }, {}, {}, {}, {}, {},
    { text: '', fillColor: '#ffffff' },
    { text: '', fillColor: '#ffffff' }
  ]);

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: comprobanteRetencion.infoTributaria[0].nombreComercial[0],
      ruc: comprobanteRetencion.infoTributaria[0].ruc[0],
      titulo: 'COMPROBANTE DE RETENCIÓN',
      secuencial: comprobanteRetencion.infoTributaria[0].estab[0] + '-' + comprobanteRetencion.infoTributaria[0].ptoEmi[0] + '-' + comprobanteRetencion.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: comprobanteRetencion.infoTributaria[0].razonSocial[0],
      matrizDir: comprobanteRetencion.infoTributaria[0].dirMatriz[0],
      estab: comprobanteRetencion.infoTributaria[0].estab[0],
      sucDir: comprobanteRetencion.infoCompRetencion[0].dirEstablecimiento ? comprobanteRetencion.infoCompRetencion[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial,
      ambiente: c.ambiente,
      obligadoContabilidad: comprobanteRetencion.infoCompRetencion[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: comprobanteRetencion.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: c.fechaAutorizacionFmt,
      barcode: c.barcode
    },
    cliente: {
      margin: [0, 0, 0, 8],
      table: {
        widths: ['30%', '20%', '25%', '25%'],
        body: [
          [{ text: 'Razón Social / Nombres y Apellidos:', bold: true }, { text: comprobanteRetencion.infoCompRetencion[0].razonSocialSujetoRetenido[0], colSpan: 3 }, {}, {}],
          [{ text: 'RUC / CI:', bold: true }, { text: comprobanteRetencion.infoCompRetencion[0].identificacionSujetoRetenido[0] }, { text: 'Fecha: Emisión:', bold: true }, { text: comprobanteRetencion.infoCompRetencion[0].fechaEmision[0] }]
        ]
      },
      layout: outerRoundedLikeBox()
    },
    detalle: {
      table: { widths, headerRows: 1, body: detBody },
      layout: lineLight(0.6, '#dddddd', [4, 4, 4, 4]),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, comprobanteRetencion.infoTributaria[0].claveAcceso[0], res);
}

function renderRetencion(c, f, res) { return renderRetencionBase(c, f, res, false); }
function renderRetencion2(c, f, res) { return renderRetencionBase(c, f, res, true); }

// ---------------- NOTA CREDITO ----------------
async function renderCredito(notaCredito, fechaAutorizacion, res) {
  const c = await buildBaseCommon(notaCredito, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo;
  const contribuyenteEspecial = notaCredito.infoNotaCredito[0].contribuyenteEspecial ? notaCredito.infoNotaCredito[0].contribuyenteEspecial[0] : '';
  if (!notaCredito.infoNotaCredito[0].direccionComprador) notaCredito.infoNotaCredito[0].direccionComprador = [''];

  const detBody = [[
    thead('COD'), thead('COD. AUX.'), thead('DESCRIPCIÓN'), thead('CANT.'), thead('P. UNITARIO'), thead('TOTAL ÍTEM')
  ]];

  notaCredito.detalles[0].detalle.forEach(i => {
    detBody.push([
      td(i.codigoInterno[0]),
      td(i.codigoAdicional ? i.codigoAdicional[0] : ''),
      td(i.descripcion[0]),
      tdNum(i.cantidad[0]),
      tdMoney(i.precioUnitario[0]),
      tdMoney(i.precioTotalSinImpuesto[0])
    ]);
  });

  const infoAdTxt = infoAdditionalText(notaCredito);
  let ivasStack = '';
  notaCredito.infoNotaCredito[0].totalConImpuestos[0].totalImpuesto.forEach(i => {
    ivasStack += 'IVA ' + params.sri.tarifaIVA[i.codigoPorcentaje[0]] + '   $ ' + i.valor[0] + '\n';
  });

  detBody.push([
    { text: 'Información Adicional', colSpan: 4, color: COLOR_AZUL, fontSize: 8, bold: true }, {}, {}, {},
    { text: 'SUBTOTAL', fillColor: BG_TOTAL_ALT, bold: true },
    { text: money(notaCredito.infoNotaCredito[0].totalSinImpuestos[0]), fillColor: BG_TOTAL_ALT, alignment: 'right' }
  ]);
  detBody.push([
    { text: infoAdTxt, colSpan: 4, rowSpan: 2, fontSize: 7 }, {}, {}, {},
    { text: ivasStack, colSpan: 2, fillColor: BG_TOTAL_ALT, fontSize: 8 }, {}
  ]);
  detBody.push([
    {}, {}, {}, {},
    { text: 'VALOR TOTAL:', fillColor: BG_TOTAL_ALT, bold: true },
    { text: money(notaCredito.infoNotaCredito[0].valorModificacion[0]), fillColor: BG_TOTAL_ALT, alignment: 'right', bold: true }
  ]);

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: notaCredito.infoTributaria[0].nombreComercial[0],
      ruc: notaCredito.infoTributaria[0].ruc[0],
      titulo: 'NOTA DE CRÉDITO',
      secuencial: notaCredito.infoTributaria[0].estab[0] + '-' + notaCredito.infoTributaria[0].ptoEmi[0] + '-' + notaCredito.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: notaCredito.infoTributaria[0].razonSocial[0],
      matrizDir: notaCredito.infoTributaria[0].dirMatriz[0],
      estab: notaCredito.infoTributaria[0].estab[0],
      sucDir: notaCredito.infoNotaCredito[0].dirEstablecimiento ? notaCredito.infoNotaCredito[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial,
      ambiente: c.ambiente,
      obligadoContabilidad: notaCredito.infoNotaCredito[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: notaCredito.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: c.fechaAutorizacionFmt,
      barcode: c.barcode
    },
    cliente: {
      margin: [0, 0, 0, 8],
      table: {
        widths: ['33%', '67%'],
        body: [
          [{ text: 'Razón Social / Nombres y Apellidos:', bold: true }, { text: notaCredito.infoNotaCredito[0].razonSocialComprador[0] }],
          [{ text: 'RUC / CI:', bold: true }, { text: notaCredito.infoNotaCredito[0].identificacionComprador[0] + '   Fecha: Emisión: ' + notaCredito.infoNotaCredito[0].fechaEmision[0] }],
          [{ text: 'Dirección:', bold: true }, { text: notaCredito.infoNotaCredito[0].direccionComprador[0] }],
          [{ text: 'Comprobante que se modifica:', bold: true }, { text: (params.sri.codDocSustento[notaCredito.infoNotaCredito[0].codDocModificado[0]] || '') + ' | ' + notaCredito.infoNotaCredito[0].numDocModificado[0] }],
          [{ text: 'Fecha emisión (Comprobante a modificar):', bold: true }, { text: notaCredito.infoNotaCredito[0].fechaEmisionDocSustento[0] }],
          [{ text: 'Razón de modificación:', bold: true }, { text: notaCredito.infoNotaCredito[0].motivo[0] }]
        ]
      },
      layout: outerOnlyBoxLayout()
    },
    detalle: {
      table: { widths: ['9%', '13%', '*', '10%', '13%', '13%'], headerRows: 1, body: detBody },
      layout: lineLight(),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, notaCredito.infoTributaria[0].claveAcceso[0], res);
}

// ---------------- NOTA DEBITO ----------------
async function renderDebito(notaDebito, fechaAutorizacion, res) {
  const c = await buildBaseCommon(notaDebito, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo || { imgWidth: '50%' };
  if (!notaDebito.infoNotaDebito[0].direccionComprador) notaDebito.infoNotaDebito[0].direccionComprador = [''];

  const detBody = [[thead('RAZÓN DE LA MODIFICACIÓN'), thead('VALOR')]];
  let total = 0;
  notaDebito.motivos[0].motivo.forEach(i => {
    total += parseFloat(i.valor[0] || 0);
    detBody.push([td(i.razon[0]), tdNum(i.valor[0])]);
  });

  const infoAdTxt = infoAdditionalText(notaDebito);
  let ivasStack = '';
  notaDebito.infoNotaDebito[0].impuestos[0].impuesto.forEach(i => {
    ivasStack += 'IVA ' + params.sri.tarifaIVA[i.codigoPorcentaje[0]] + '   $ ' + i.valor[0] + '\n';
  });

  detBody.push([
    { text: 'Información Adicional', color: COLOR_AZUL, bold: true, fontSize: 8 },
    { text: 'SUBTOTAL   ' + money(notaDebito.infoNotaDebito[0].totalSinImpuestos[0]), fillColor: BG_TOTAL_ALT, bold: true }
  ]);
  detBody.push([
    { text: infoAdTxt, fontSize: 7 },
    { text: ivasStack, fillColor: BG_TOTAL_ALT, fontSize: 8 }
  ]);
  detBody.push([
    { text: '' },
    { text: 'VALOR TOTAL:   ' + money(total), fillColor: BG_TOTAL_ALT, bold: true }
  ]);

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: notaDebito.infoTributaria[0].nombreComercial[0],
      ruc: notaDebito.infoTributaria[0].ruc[0],
      titulo: 'NOTA DE DÉBITO',
      secuencial: notaDebito.infoTributaria[0].estab[0] + '-' + notaDebito.infoTributaria[0].ptoEmi[0] + '-' + notaDebito.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: notaDebito.infoTributaria[0].razonSocial[0],
      matrizDir: notaDebito.infoTributaria[0].dirMatriz[0],
      estab: notaDebito.infoTributaria[0].estab[0],
      sucDir: notaDebito.infoNotaDebito[0].dirEstablecimiento ? notaDebito.infoNotaDebito[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial: '',
      ambiente: c.ambiente,
      obligadoContabilidad: notaDebito.infoNotaDebito[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: notaDebito.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: moment(fechaAutorizacion, 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
      barcode: c.barcode
    },
    cliente: {
      margin: [0, 0, 0, 8],
      table: {
        widths: ['33%', '67%'],
        body: [
          [{ text: 'Razón Social / Nombres y Apellidos:', bold: true }, { text: notaDebito.infoNotaDebito[0].razonSocialComprador[0] }],
          [{ text: 'RUC / CI:', bold: true }, { text: notaDebito.infoNotaDebito[0].identificacionComprador[0] + '   Fecha: Emisión: ' + notaDebito.infoNotaDebito[0].fechaEmision[0] }],
          [{ text: 'Dirección:', bold: true }, { text: notaDebito.infoNotaDebito[0].direccionComprador[0] }],
          [{ text: 'Comprobante que se modifica:', bold: true }, { text: (params.sri.codDocSustento[notaDebito.infoNotaDebito[0].codDocModificado[0]] || '') + ' | ' + notaDebito.infoNotaDebito[0].numDocModificado[0] }],
          [{ text: 'Fecha emisión (Comprobante a modificar):', bold: true }, { text: notaDebito.infoNotaDebito[0].fechaEmisionDocSustento[0] }]
        ]
      },
      layout: outerOnlyBoxLayout()
    },
    detalle: {
      table: { widths: ['*', '20%'], headerRows: 1, body: detBody },
      layout: lineLight(),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, notaDebito.infoTributaria[0].claveAcceso[0], res);
}

// ---------------- GUIA DE REMISION ----------------
async function renderRemision(guiaRemision, fechaAutorizacion, res) {
  const c = await buildBaseCommon(guiaRemision, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo;
  if (!guiaRemision.infoGuiaRemision[0].direccionComprador) guiaRemision.infoGuiaRemision[0].direccionComprador = [''];

  const destinatariosBlocks = [];
  guiaRemision.destinatarios[0].destinatario.forEach(i => {
    const codDocSustento = i.codDocSustento ? params.sri.codDocSustento[i.codDocSustento[0]] : '';
    const fechaEmisionDocSustento = i.fechaEmisionDocSustento ? i.fechaEmisionDocSustento[0] : '';
    const numAutDocSustento = i.numAutDocSustento ? (Array.isArray(i.numAutDocSustento) ? i.numAutDocSustento[0] : i.numAutDocSustento) : '';
    const numDocSustento = i.numDocSustento ? i.numDocSustento[0] : '';
    const ruta = i.ruta ? i.ruta[0] : '';
    const motivoTraslado = i.motivoTraslado ? i.motivoTraslado[0] : '';
    const razonSocialDestinatario = i.razonSocialDestinatario ? i.razonSocialDestinatario[0] : '';
    const identificacionDestinatario = i.identificacionDestinatario ? i.identificacionDestinatario[0] : '';
    const dirDestinatario = i.dirDestinatario ? i.dirDestinatario[0] : '';

    const detalleBody = [[thead('CÓDIGO INTERNO'), thead('DESCRIPCIÓN'), thead('CANTIDAD')]];
    i.detalles[0].detalle.forEach(j => {
      detalleBody.push([
        td(j.codigoInterno[0]),
        td(j.descripcion[0]),
        tdNum(j.cantidad[0])
      ]);
    });

    destinatariosBlocks.push({
      margin: [0, 0, 0, 8],
      stack: [
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [{ text: 'Tipo:', bold: true }, { text: codDocSustento }, { text: 'Fecha de Emisión:', bold: true }, { text: fechaEmisionDocSustento }],
              [{ text: 'Autorización:', bold: true }, { text: numAutDocSustento }, { text: 'Secuencial:', bold: true }, { text: numDocSustento }],
              [{ text: 'Destinatario:', bold: true }, { text: razonSocialDestinatario }, { text: 'RUC/CI:', bold: true }, { text: identificacionDestinatario }],
              [{ text: 'Dirección Destinatario:', bold: true }, { text: dirDestinatario, colSpan: 3 }, {}, {}],
              [{ text: 'Ruta:', bold: true }, { text: ruta }, { text: 'Motivo:', bold: true }, { text: motivoTraslado }]
            ]
          },
          layout: outerOnlyBoxLayout()
        },
        {
          margin: [0, 4, 0, 0],
          table: { widths: ['25%', '*', '15%'], headerRows: 1, body: detalleBody },
          layout: lineLight()
        }
      ]
    });
  });

  const infoAdTxt = infoAdditionalText(guiaRemision);

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: guiaRemision.infoTributaria[0].nombreComercial[0],
      ruc: guiaRemision.infoTributaria[0].ruc[0],
      titulo: 'GUÍA DE REMISIÓN',
      secuencial: guiaRemision.infoTributaria[0].estab[0] + '-' + guiaRemision.infoTributaria[0].ptoEmi[0] + '-' + guiaRemision.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: guiaRemision.infoTributaria[0].razonSocial[0],
      matrizDir: guiaRemision.infoTributaria[0].dirMatriz[0],
      estab: guiaRemision.infoTributaria[0].estab[0],
      sucDir: guiaRemision.infoGuiaRemision[0].dirEstablecimiento ? guiaRemision.infoGuiaRemision[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial: '',
      ambiente: c.ambiente,
      obligadoContabilidad: guiaRemision.infoGuiaRemision[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: guiaRemision.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: c.fechaAutorizacionFmt,
      barcode: c.barcode
    },
    cliente: buildCliente4Cols([
      [{ text: 'Razón Social / Nombres y Apellidos:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].razonSocialTransportista[0], colSpan: 3 }, {}, {}],
      [{ text: 'RUC / CI:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].rucTransportista[0] }, { text: 'Placa:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].placa[0] }],
      [{ text: 'Dirección de Partida:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].dirPartida[0], colSpan: 3 }, {}, {}],
      [{ text: 'Fecha de Inicio:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].fechaIniTransporte[0] }, { text: 'Fecha de Fin:', bold: true }, { text: guiaRemision.infoGuiaRemision[0].fechaFinTransporte[0] }]
    ]),
    extraTop: { stack: destinatariosBlocks },
    detalle: {
      table: {
        widths: ['*'],
        body: [
          [{ text: 'Información Adicional', color: COLOR_AZUL, bold: true, alignment: 'center', fontSize: 8 }],
          [{ text: infoAdTxt, alignment: 'center', fontSize: 7 }]
        ]
      },
      layout: lineLight(),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, guiaRemision.infoTributaria[0].claveAcceso[0], res);
}

// ---------------- LIQUIDACION DE COMPRA ----------------
async function renderLiquidacion(liquidacionCompra, fechaAutorizacion, res) {
  const c = await buildBaseCommon(liquidacionCompra, fechaAutorizacion, null, {});
  const doc = baseDocDef();
  const databaseInfo = c.databaseInfo;
  const direccionProveedor = liquidacionCompra.infoLiquidacionCompra[0].direccionProveedor ? liquidacionCompra.infoLiquidacionCompra[0].direccionProveedor[0] : '';
  const detAdicional = params.RIDE.optionalItems.detAdicional.status ? params.RIDE.optionalItems.detAdicional.mode : -1;
  const hasCodAux = params.RIDE.optionalItems.codigoAuxiliar;
  const hasDetAdic0 = detAdicional == 0;
  const detAdicNames = params.RIDE.optionalItems.detAdicional.names;

  const widths = ['9%'];
  const headerRow = [thead(params.RIDE.name.codigoPrincipal)];
  if (hasCodAux) { widths.push('9%'); headerRow.push(thead(params.RIDE.name.codigoAuxiliar)); }
  widths.push('*'); headerRow.push(thead(params.RIDE.name.descripcion));
  if (hasDetAdic0) detAdicNames.forEach(n => { widths.push('auto'); headerRow.push(thead(n)); });
  widths.push('8%'); headerRow.push(thead(params.RIDE.name.cantidad));
  widths.push('12%'); headerRow.push(thead(params.RIDE.name.precioUnitario));
  widths.push('12%'); headerRow.push(thead(params.RIDE.name.precioTotal));

  const detBody = [headerRow];
  liquidacionCompra.detalles[0].detalle.forEach(i => {
    const row = [td(i.codigoPrincipal[0])];
    if (hasCodAux) row.push(td(i.codigoAuxiliar ? i.codigoAuxiliar[0] : ''));
    row.push(td(i.descripcion[0]));
    if (hasDetAdic0) {
      for (let j = 0; j < detAdicNames.length; j++) {
        const val = i.detallesAdicionales && i.detallesAdicionales[0].detAdicional[j]
          ? i.detallesAdicionales[0].detAdicional[j]['$'].valor
          : '';
        row.push(td(val));
      }
    }
    row.push(tdNum(parseFloat(i.cantidad[0] || 0).toFixed(2)));
    row.push(tdMoney(i.precioUnitario[0]));
    row.push(tdMoney(parseFloat(i.precioTotalSinImpuesto[0] || 0) + parseFloat(i.descuento[0] || 0)));
    detBody.push(row);
  });

  let subtotal12 = 0, subtotal0 = 0, iva = 0, ice = 0;
  liquidacionCompra.infoLiquidacionCompra[0].totalConImpuestos[0].totalImpuesto.forEach(i => {
    if (i.codigo == '2' && i.codigoPorcentaje == '2') { iva = parseFloat(i.valor || 0); subtotal12 = parseFloat(i.baseImponible || 0); }
    else if (i.codigo == '2') subtotal0 = parseFloat(i.baseImponible || 0);
    else if (i.codigo == '3') ice = parseFloat(i.baseImponible || 0);
  });

  if (detAdicional == 1) {
    const last = liquidacionCompra.detalles[0].detalle[liquidacionCompra.detalles[0].detalle.length - 1];
    if (last.detallesAdicionales) {
      const obs = { $: { nombre: 'Descripcion' }, _: last.detallesAdicionales[0].detAdicional[0]['$'].valor };
      if (liquidacionCompra.infoAdicional) liquidacionCompra.infoAdicional[0].campoAdicional.push(obs);
      else liquidacionCompra.infoAdicional = [{ campoAdicional: [obs] }];
    }
  }

  const infoAdTxt = infoAdditionalText(liquidacionCompra);
  const cs = widths.length;
  const labelSpan = cs - 2;

  function totalRow(label, value, opts = {}) {
    const row = new Array(cs).fill({ text: '' });
    for (let k = 0; k < labelSpan; k++) row[k] = {};
    row[cs - 2] = { text: label, fillColor: BG_TOTAL, fontSize: 8, bold: !!opts.bold };
    row[cs - 1] = { text: money(value), fillColor: BG_TOTAL, fontSize: 8, alignment: 'right', bold: !!opts.bold };
    return row;
  }

  const infoRow = new Array(cs).fill({ text: '' });
  infoRow[0] = { text: infoAdTxt || 'Información Adicional', colSpan: labelSpan, rowSpan: 6, color: COLOR_AZUL, fontSize: 7 };
  for (let k = 1; k < labelSpan; k++) infoRow[k] = {};
  infoRow[cs - 2] = { text: 'SUBTOTAL(0%)', fillColor: BG_TOTAL, fontSize: 8 };
  infoRow[cs - 1] = { text: money(subtotal0), fillColor: BG_TOTAL, fontSize: 8, alignment: 'right' };
  detBody.push(infoRow);
  detBody.push(totalRow('SUBTOTAL(12%)', subtotal12));
  detBody.push(totalRow('DESCUENTO', parseFloat(liquidacionCompra.infoLiquidacionCompra[0].totalDescuento[0] || 0)));
  detBody.push(totalRow('IVA', iva));
  detBody.push(totalRow('ICE', ice));
  if (params.RIDE.optionalItems.propina.status) detBody.push(totalRow(params.RIDE.optionalItems.propina.name, parseFloat(liquidacionCompra.infoLiquidacionCompra[0].propina[0] || 0)));
  detBody.push(totalRow('TOTAL', parseFloat(liquidacionCompra.infoLiquidacionCompra[0].importeTotal[0] || 0), { bold: true }));

  const fpHead = new Array(cs).fill({ text: '' });
  fpHead[0] = { text: 'Forma de pago:', colSpan: cs, color: COLOR_AZUL, fontSize: 8, bold: true };
  for (let k = 1; k < cs; k++) fpHead[k] = {};
  detBody.push(fpHead);

  if (liquidacionCompra.infoLiquidacionCompra[0].pagos) {
    liquidacionCompra.infoLiquidacionCompra[0].pagos[0].pago.forEach(i => {
      const r = new Array(cs).fill({ text: '' });
      r[0] = { text: params.sri.formaPago[i.formaPago[0]], colSpan: cs - 1, fontSize: 7 };
      for (let k = 1; k < cs - 1; k++) r[k] = {};
      r[cs - 1] = { text: money(i.total[0]), fillColor: BG_TOTAL, alignment: 'right', fontSize: 8 };
      detBody.push(r);
    });
  }

  pushRideBase(doc, {
    header: {
      imgSrc: c.imgSrc,
      imgWidth: databaseInfo.imgWidth,
      nombreComercial: liquidacionCompra.infoTributaria[0].nombreComercial[0],
      ruc: liquidacionCompra.infoTributaria[0].ruc[0],
      titulo: 'LIQUIDACIÓN DE COMPRA',
      secuencial: liquidacionCompra.infoTributaria[0].estab[0] + '-' + liquidacionCompra.infoTributaria[0].ptoEmi[0] + '-' + liquidacionCompra.infoTributaria[0].secuencial[0]
    },
    empresa: {
      razonSocial: liquidacionCompra.infoTributaria[0].razonSocial[0],
      matrizDir: liquidacionCompra.infoTributaria[0].dirMatriz[0],
      estab: liquidacionCompra.infoTributaria[0].estab[0],
      sucDir: liquidacionCompra.infoLiquidacionCompra[0].dirEstablecimiento ? liquidacionCompra.infoLiquidacionCompra[0].dirEstablecimiento[0] : '',
      contribuyenteEspecial: '',
      ambiente: c.ambiente,
      obligadoContabilidad: liquidacionCompra.infoLiquidacionCompra[0].obligadoContabilidad[0],
      tipoEmision: c.tipoEmision,
      leyendaCatastro: c.leyenda_catastro,
      claveAcceso: liquidacionCompra.infoTributaria[0].claveAcceso[0],
      fechaAutorizacion: c.fechaAutorizacionFmt,
      barcode: c.barcode
    },
    cliente: buildCliente4Cols([
      [{ text: 'Razón Social / Nombres y Apellidos:', bold: true, colSpan: 4 }, {}, {}, { text: liquidacionCompra.infoLiquidacionCompra[0].razonSocialProveedor[0] }],
      [{ text: 'RUC / CI:', bold: true }, { text: liquidacionCompra.infoLiquidacionCompra[0].identificacionProveedor[0] }, { text: 'Fecha: Emisión:', bold: true }, { text: liquidacionCompra.infoLiquidacionCompra[0].fechaEmision[0] }],
      [{ text: 'Dirección:', bold: true }, { text: direccionProveedor, colSpan: 3 }, {}, {}]
    ]),
    detalle: {
      table: { widths, headerRows: 1, body: detBody },
      layout: lineLight(),
      margin: [0, 0, 0, 0]
    }
  });

  renderDoc(doc, liquidacionCompra.infoTributaria[0].claveAcceso[0], res);
}

module.exports = {
  renderFactura,
  renderRetencion,
  renderRetencion2,
  renderCredito,
  renderDebito,
  renderRemision,
  renderLiquidacion
};
