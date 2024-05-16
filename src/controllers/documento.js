const moment = require("moment");
const express = require("express");
const Sybase = require("sybase");
const path = require("path");
const pdf = require("html-pdf");
const fs = require("fs");
const axios = require("axios");
const nodemailer = require("nodemailer");
const parseString = require("xml2js").parseString;

const params = require("../libs/params");
const utilities = require("../libs/utilities");

var ctrl = {};
ctrl.get = (req, res) => {
  const fecha = req.body.params.fecha_autorizacion
    ? "fecha_autorizacion"
    : "fecha_comprobante";
  const connection = utilities.dbConnection(req.params.db);
  var query =
    "SELECT ce_id,ce_xml,ruc_emisor,ruc_comprador,nombre_comprador=web_clear_special(nombre_comprador),fecha_comprobante,numero_comprobante,clave_acceso,numero_autorizacion,fecha_autorizacion,tipo_comprobante,xml_autorizado " +
    "FROM ce_comprobante " +
    "where(ruc_comprador = '" +
    req.params.cedula_ruc +
    "' or ruc_comprador = SUBSTR('" +
    req.params.cedula_ruc +
    "',0,11) or ruc_comprador = '" +
    req.params.cedula_ruc +
    "'+'001') " +
    "and estado = 4 " +
    "and DATE(" +
    fecha +
    ") >= '" +
    req.params.start +
    "' and DATE(" +
    fecha +
    ") <= '" +
    req.params.end +
    "' " +
    "and ruc_comprador <> '9999999999999' and '" +
    req.body.empresas +
    "' like '%'+ruc_emisor+'%' " +
    "and ('" +
    req.body.estacion +
    "' LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = '" +
    req.body.estacion +
    "') " +
    "and ('" +
    req.body.punto +
    "' LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ','= '" +
    req.body.punto +
    "') " +
    "and '" +
    req.body.tipos +
    "' like '%,'+tipo_comprobante+',%'";
  let db = new Sybase(
    connection.host,
    connection.port,
    connection.db,
    connection.user,
    connection.pass
  );
  db.connect((err) => {
    if (err) console.log(err);
    db.query(query, async (err, data) => {
      if (err) console.log(err);
      await utilities.asyncForEach(data, async (i) => {
        var xml = await utilities.asyncParseString(i.ce_xml);
        i.val = utilities.getValorFromXml(xml);
      });
      res.json(data);
      db.disconnect();
    });
  });
};

ctrl.getLike = (req, res) => {
  const fecha = req.body.params.fecha_autorizacion
    ? "fecha_autorizacion"
    : "fecha_comprobante";
  const connection = utilities.dbConnection(req.params.db);
  var query =
    "SELECT ce_id,ce_xml,ruc_emisor,ruc_comprador,nombre_comprador=web_clear_special(nombre_comprador),fecha_comprobante,numero_comprobante,clave_acceso,numero_autorizacion,fecha_autorizacion,tipo_comprobante,xml_autorizado " +
    "FROM ce_comprobante " +
    "WHERE DATE(" +
    fecha +
    ") >= '" +
    req.params.start +
    "' and DATE(" +
    fecha +
    ") <= '" +
    req.params.end +
    "' " +
    "and '" +
    req.body.empresas +
    "' like '%'+ruc_emisor+'%' " +
    "and ('" +
    req.body.estacion +
    "' LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = '" +
    req.body.estacion +
    "') " +
    "and ('" +
    req.body.punto +
    "' LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ','= '" +
    req.body.punto +
    "') " +
    "and '" +
    req.body.tipos +
    "' like '%,'+tipo_comprobante+',%'";
  let db = new Sybase(
    connection.host,
    connection.port,
    connection.db,
    connection.user,
    connection.pass
  );
  db.connect((err) => {
    if (err) console.log(err);
    db.query(query, async (err, data) => {
      if (err) console.log(err);
      await utilities.asyncForEach(data, async (i) => {
        var xml = await utilities.asyncParseString(i.ce_xml);
        i.val = utilities.getValorFromXml(xml);
      });
      res.json(data);
      db.disconnect();
    });
  });
};

ctrl.rideFactura = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var factura = result.factura;
    var ambiente =
      factura.infoTributaria[0].ambiente[0] == "1" ? "PRUEBA" : "PRODUCCIÓN";
    var tipoEmision =
      factura.infoTributaria[0].tipoEmision[0] == "1" ? "NORMAL" : "";
    var direccionComprador = factura.infoFactura[0].direccionComprador
      ? factura.infoFactura[0].direccionComprador[0]
      : "";
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        factura.infoTributaria[0].ruc[0],
        factura.infoTributaria[0].estab[0],
        factura.infoTributaria[0].ptoEmi[0]
      );
    var databaseInfo = utilities.getDatabaseInfoByRuc(
      factura.infoTributaria[0].ruc[0],
      factura.infoTributaria[0].estab[0],
      factura.infoTributaria[0].ptoEmi[0]
    );
    imgSrc = path.normalize(imgSrc);
    var contribuyenteEspecial = factura.infoFactura[0].contribuyenteEspecial
      ? "CONTRIBUYENTE ESPECIAL: " +
      factura.infoFactura[0].contribuyenteEspecial[0]
      : "";
    var placa = factura.infoFactura[0].placa
      ? factura.infoFactura[0].placa[0]
      : "";

    let barcode = await utilities.getBarcode(
      factura.infoTributaria[0].claveAcceso[0]
    );
    //Validar show de detAdicional: -1 no mostrar nada, 0 mostrar todo, 1 mostrar el ultimo
    var detAdicional = params.RIDE.optionalItems.detAdicional.status
      ? params.RIDE.optionalItems.detAdicional.mode
      : -1;

    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(factura);
    //Fin
    var body = `<table id="infoRide">
    <tr>
      <td rowspan="4">
        <img src="${imgSrc}" />
      </td>
      <td style="font-size: 1em; color: #2239ff">
        ${factura.infoTributaria[0].nombreComercial[0]}
      </td>
    </tr>
    <tr>
      <td style="font-size: 1em">R.U.C.: ${factura.infoTributaria[0].ruc[0]}</td>
    </tr>
    <tr>
      <td style="font-size: 1.1em; background-color: black; color: white">
        F A C T U R A
      </td>
    </tr>
    <tr>
      <td style="font-size: 1em; color: #3583ea">
        ${factura.infoTributaria[0].estab[0]}-${factura.infoTributaria[0].ptoEmi[0]}-${factura.infoTributaria[0].secuencial[0]}
      </td>
    </tr>
  </table>
  
  <table id="infoEmpresa" cellspacing="0">
    <tr>
      <td
        colspan="2"
        style="
          border-top: 1px solid black;
          border-left: 1px solid black;
          border-right: 1px solid black;
        "
      >
        ${factura.infoTributaria[0].razonSocial[0]}
      </td>
      <td style="padding-left: 2em; font-weight: bold">
        Número de autorización:
      </td>
    </tr>
    <tr>
      <td style="border-left: 1px solid black; font-weight: bold">Matriz</td>
      <td style="border-right: 1px solid black">
        ${factura.infoTributaria[0].dirMatriz[0]}
      </td>
      <td style="padding-left: 2em">
        ${factura.infoTributaria[0].claveAcceso[0]}
      </td>
    </tr>
    <tr>
      <td style="border-left: 1px solid black; font-weight: bold">
        Suc. (${factura.infoTributaria[0].estab[0]})
      </td>
      <td style="border-right: 1px solid black">
        ${factura.infoFactura[0].dirEstablecimiento[0]}
      </td>
      <td style="padding-left: 2em">
        <span style="font-weight: bold">Fecha y hora de autorización: </span>
        ${moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss").add(-5, "hours").format("YYYY-MM-DD HH:mm:ss")}
      </td>
    </tr>
    <tr>
      <td
        colspan="2"
        style="border-left: 1px solid black; border-right: 1px solid black"
      >
        ${contribuyenteEspecial}
      </td>
      <td style="padding-left: 2em">
        <span style="font-weight: bold">Ambiente: </span>
        ${ambiente}
      </td>
    </tr>
    <tr>
      <td
        colspan="2"
        style="border-left: 1px solid black; border-right: 1px solid black"
      >
        Obligado a llevar contabilidad: ${factura.infoFactura[0].obligadoContabilidad[0]}
      </td>
      <td style="padding-left: 2em">
        <span style="font-weight: bold">Emisión: </span>
        ${tipoEmision}
      </td>
    </tr>
    <tr>
      <td
        colspan="2"
        style="font-size: ${leyenda_catastro.size}; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black"
      >
        ${leyenda_catastro.text}
      </td>
      <td style="padding-left: 2em; font-weight: bold">Clave de acceso:</td>
    </tr>
    <tr>
      <td style="padding-left: 2em" colspan="2" rowspan="2"></td>
      <td style="padding-left: 2em">${factura.infoTributaria[0].claveAcceso[0]}</td>
    </tr>
    <tr>
      <td style="padding-left: 2em">
        <img src="${barcode}" style="width: 30em" align:right />
      </td>
    </tr>
  </table>
  
  <table id="infoCliente">
    <tr>
      <td colspan="4">
        <span style="font-weight: bold">Razón Social / Nombres y Apellidos:</span>
        ${factura.infoFactura[0].razonSocialComprador[0]}
      </td>
    </tr>
    <tr>
      <td style="font-weight: bold">RUC /CI:</td>
      <td>${factura.infoFactura[0].identificacionComprador[0]}</td>
      <td style="font-weight: bold">Fecha:</td>
      <td>${factura.infoFactura[0].fechaEmision[0]}</td>
    </tr>
  </table>
  `;

    if (direccionComprador != "")
      body += `
              <tr>
                <td colspan="4">
                  <span style="font-weight: bold">Dirección: </span>${direccionComprador}
                </td>
              </tr>
              `

    if (placa != "")
      body += `
              <tr>
                <td colspan="4"><span style="font-weight: bold">Placa: </span>${placa}</td>
              </tr>    
              `;

    body += `
    </table>
      <table id="detalle" style="margin-top: 1em">
          <tr style="font-size: 0.9em; background-color: #0d47a1;  color: white">
              <th style="padding: 0.7em">
                  ${params.RIDE.name.codigoPrincipal}
              </th>      
    `

    body += params.RIDE.optionalItems.codigoAuxiliar
      ? `<th>${params.RIDE.name.codigoAuxiliar}</th>`
      : "";

    body += `<th>${params.RIDE.name.descripcion}</th>`;
    body += `<th>${params.RIDE.name.cantidad}</th>`;
    body += `<th>${params.RIDE.name.precioUnitario}</th>`;
    if (detAdicional == 0) params.RIDE.optionalItems.detAdicional.names.forEach((i) => (body += `<th>${i}</th>`));

    //Parametrización del subsidio
    if (databaseInfo.subsidio.status) {
      body += `
            <th>${databaseInfo.subsidio.label.subsidio}</th>
            <th>${databaseInfo.subsidio.label.precio_sin_subsidio}</th>      
      `;
    }
    //Fin
    body += `
      <th>${params.RIDE.name.descuento}</th>
      <th>${params.RIDE.name.precioTotal}</th>
    </tr>    
    `;
    var total_subsidio = 0;

    factura.detalles[0].detalle.forEach((i) => {
      const precioUnitario = parseFloat(i.precioUnitario[0]);
      body += `
          <tr>
            <td style="text-align: center; font-size: 0.7em">${i.codigoPrincipal[0]}</td>
      `;
      if (params.RIDE.optionalItems.codigoAuxiliar)
        body += i.codigoAuxiliar ? `<td style="font-size: 0.7em">${i.codigoAuxiliar[0]}</td>` : `<td></td>`;
      body += `<td style="font-size: .8em">${i.descripcion[0]}</td>`;
      body += `<td style="text-align: center">${parseFloat(i.cantidad[0]).toFixed(2)}</td>`;
      if (detAdicional == 0)
        for (var j = 0; j < params.RIDE.optionalItems.detAdicional.names.length; j++) {
          if (i.detallesAdicionales)
            body += i.detallesAdicionales[0].detAdicional[j]
              ? `
              <td style="font-size: 0.8em">
                ${i.detallesAdicionales[0].detAdicional[j]["$"].valor}
              </td>
            `
              : `<td></td>`;
          else body += `<td></td>`;
        }
      body += `
      <td>
        <span style="text-align:left">$</span>
        <span style="float: right; background-color: #f5f5f5">
          ${parseFloat(i.precioUnitario[0]).toFixed(2)}
          </span>
      </td>
      `;

      //Parametrización del subsidio
      if (databaseInfo.subsidio.status) {
        var precioSinSubsidio = parseFloat(i.precioSinSubsidio[0]);

        var cantidad = parseFloat(i.cantidad[0]);
        subsidio = precioUnitario * cantidad - precioSinSubsidio;
        total_subsidio += subsidio;
        body += `
            <td style="text-align: right">${subsidio.toFixed(6)}</td>
            <td style="text-align: right">${precioSinSubsidio.toFixed(2)}</td>
        `;
      }

      //descuento

      body += `
        <td>
            <span style="float: right; background-color: #f5f5f5">
            ${parseFloat(i.descuento[0]).toFixed(2)}
            </span>
        </td>
      `;

      // subtotal

      body += `
        <td>
            <span style="text-align:left">$</span>
            <span style="float: right; background-color: #f5f5f5">
            ${(parseFloat(i.precioTotalSinImpuesto[0]) + parseFloat(i.descuento[0])).toFixed(2)}
            </span>
        </td>
      </tr>
      `;
    });

    var colspan = utilities.getColspan();
    var rowspan = utilities.getRowspan();
    if (detAdicional == 2) {
      if (factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales)
        body += '<tr ><td style="text-align: center; font-size: 0.7em" colspan="' + (7 + colspan) + '">' +
          factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales[0].detAdicional[0]["$"].valor + "</td></tr>";
    }

    //Sacar totales
    var subtotal = 0.0;
    var subtotal12 = 0.0;
    var subtotal0 = 0.0;
    var subtotalnoi = 0.0;
    var iva = 0.0;
    var ice = 0.0;
    var nombreImpuesto = '15%'
    let nombreIVA = '15%';
    let codigo = 0; codigoPorcentaje = 0;
    body += `
      <tr class="totalDetalle">
        <td
          colspan="${(2 + colspan)}"
          style="color: #0d47a1; font-size: 0.9em; color: #0d47a1"
        >
          Información Adicional
        </td>
    `;

    factura.infoFactura[0].totalConImpuestos[0].totalImpuesto.map(i => {
      codigo = params.getItem(params.sri.codigoIVA, 'codigo', i.codigo, 'codigo')
      codigoPorcentaje = params.getItem(params.sri.codigoIVA, 'codigo', i.codigoPorcentaje, 'codigo')
      console.log(i.codigo, i.codigoPorcentaje)
      if (i.codigo == codigo && i.codigoPorcentaje == codigoPorcentaje) {
        //iva = parseFloat(i.valor);
        subtotal12 = parseFloat(i.baseImponible);
        nombreImpuesto = params.getItem(params.sri.codigoIVA, 'codigo', codigoPorcentaje, 'porcentaje')
      }
      return body += `
          <td colspan="3" style="background-color: #f5f5f5">SUBTOTAL ${nombreImpuesto}%</td>
          <td>
            <span style="text-align: left">$</span>
            <span style="float: right; background-color: #f5f5f5">
              ${subtotal12.toFixed(2)}
            </span>
          </td>
        </tr>
        <tr class="totalDetalle">
          <td rowspan=${(factura.infoFactura[0].totalConImpuestos[0].totalImpuesto.length > 1 ? 11 : 8 + rowspan)} colspan="${(2 + colspan)}" font-size: 0.9em">
      `;
    })

    /*factura.infoFactura[0].totalConImpuestos[0].totalImpuesto.forEach((i) => {
      if (i.codigo == "2" && i.codigoPorcentaje == "2") {
        iva = parseFloat(i.valor);
        subtotal12 = parseFloat(i.baseImponible);
      } else if (i.codigo == "2" && i.codigoPorcentaje == "6") {
        subtotalnoi = parseFloat(i.baseImponible);
      } else if (i.codigo == "2") subtotal0 = parseFloat(i.baseImponible);
      else if (i.codigo == "3") ice = parseFloat(i.baseImponible);
    });*/
    factura.detalles[0].detalle.forEach((i) => {
      subtotal = subtotal + i.cantidad * i.precioUnitario;
    });
    //subtotal=subtotal12+subtotal0;


    if (detAdicional == 1)
      if (factura.infoAdicional && factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales)
        factura.infoAdicional[0].campoAdicional.push({
          $: { nombre: "Descripcion" },
          _: factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales[0].detAdicional[0]["$"].valor,
        });
      else if (
        factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales
      )
        factura.infoAdicional = [
          {
            campoAdicional: [
              {
                $: { nombre: "Descripcion" },
                _: factura.detalles[0].detalle[factura.detalles[0].detalle.length - 1].detallesAdicionales[0].detAdicional[0]["$"].valor,
              },
            ],
          },
        ];

    if (factura.infoAdicional) {
      factura.infoAdicional[0].campoAdicional.forEach((i) => {
        body += `<span style="color: #0d47a1">-${i["$"].nombre}": </span><br>${i["_"]}<br>`;
      });
    }

    //Validación de propina
    if (params.RIDE.optionalItems.propina.status)
      body +=
        `
              </td>
                <td colspan="3" style="background-color: #f5f5f5  ">
                ${params.RIDE.optionalItems.propina.name}
              </td>
              <td>
                  <span style="text-align:left">$</span>
                  <span style="float: right; background-color: #f5f5f5"> 
                    ${parseFloat(factura.infoFactura[0].propina[0])}
                  </span>
              </td>
            </tr>
          <tr class="totalDetalle">
        `;

    body += `
      </td>
      <td colspan="3" style="background-color: #f5f5f5 ">SUBTOTAL 0%</td>
      <td>
          <span style="text-align:left">$</span>
          <span style="float: right; background-color: #f5f5f5">
              ${subtotal0.toFixed(2)}
          </span>
      </td>
    </tr>

    </td>
        <td colspan="3" style="background-color: #f5f5f5  ">SUBTOTAL NO OBJETO DE IVA</td>
        <td>
            <span style="text-align:left">$</span>
            <span style="float: right; background-color: #f5f5f5">${subtotalnoi.toFixed(2)}</span>
        </td>
    </tr>
    </td>

      <td colspan="3" style="background-color: #f5f5f5  ">SUBTOTAL SIN IMPUESTO</td>
      <td>
          <span style="text-align:left">$</span>
          <span style="float: right; background-color: #f5f5f5">${(subtotal - factura.infoFactura[0].totalDescuento[0]).toFixed(2)}</span>
      </td>
    </tr>

        <td colspan="3" style="background-color: #f5f5f5  ">SUBTOTAL SIN DESCUENTO</td>
        <td>
            <span style="text-align:left">$</span>
            <span style="float: right; background-color: #f5f5f5">${(subtotal - parseFloat(factura.infoFactura[0].totalDescuento[0])).toFixed(2)}</span>
        </td>
    </tr>
    </td>
        <td colspan="3" style="background-color: #f5f5f5  ">TOTAL DESCUENTO</td>
        <td>
            <span style="text-align:left">$</span>
            <span style="float: right; background-color: #f5f5f5">${factura.infoFactura[0].totalDescuento[0]}</span>
        </td>
    </tr>
    </td>

    <tr class="totalDetalle">
    <td colspan="3" style="background-color: #f5f5f5 ">ICE</td>
    <td>
        <span style="text-align:left">$</span>
        <span style="float: right; background-color: #f5f5f5">${ice.toFixed(2)}</span>
    </td>
    </tr>
    `;
    factura.infoFactura[0].totalConImpuestos[0].totalImpuesto.map(i => {
      codigo = params.getItem(params.sri.codigoIVA, 'codigo', i.codigo, 'codigo')
      codigoPorcentaje = params.getItem(params.sri.codigoIVA, 'codigo', i.codigoPorcentaje, 'codigo')
      if (i.codigo == codigo && i.codigoPorcentaje == codigoPorcentaje) {
        iva = parseFloat(i.valor);
        //subtotal12 = parseFloat(i.baseImponible);
        nombreIVA = params.getItem(params.sri.codigoIVA, 'codigo', codigoPorcentaje, 'porcentaje')
      }
      return body += `
        <tr class="totalDetalle">
          <td colspan="3" style="background-color: #f5f5f5  ">IVA ${nombreIVA} %</td>
          <td>
              <span style="text-align:left">$</span>
              <span style="float: right; background-color: #f5f5f5">${iva.toFixed(2)}</span>
          </td>
        </tr>
      `
    })

    body += `
    <tr class="totalDetalle">
    <td colspan="3" style="background-color: #f5f5f5; font-weight:bold  ">TOTAL</td>
    <td>
        <span style="text-align:left">$</span>
        <span style="float: right; background-color: #f5f5f5; font-weight:bold">${factura.infoFactura[0].importeTotal[0]}</span>
    </td>
    </tr>

    <tr class="totalDetalle">
    <td colspan="${(6 + colspan)}" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Forma de pago: </td>
    </tr>
    <tr class="totalDetalle">
    `;
    if (factura.infoFactura[0].pagos) {
      factura.infoFactura[0].pagos[0].pago.forEach((i) => {
        body +=
          '<td colspan="' +
          (5 + colspan) +
          '">' +
          params.sri.formaPago[i.formaPago[0]] +
          "</td>" +
          '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5">' +
          i.total[0] +
          "</span></td>";
      });
    }

    //Parametrización del subsidio
    if (databaseInfo.subsidio.status) {
      var total = parseFloat(factura.infoFactura[0].importeTotal[0]);
      body +=
        "</tr>" +
        '<tr class="totalDetalle">' +
        "<td>VALOR TOTAL SIN SUBSIDIO</td>" +
        "<td>" +
        (total + total_subsidio).toFixed(2) +
        "</td>" +
        "</tr>" +
        '<tr class="totalDetalle">' +
        '<td>AHORRO POR SUBSIDIO</td><td rowspan="2">' +
        total_subsidio.toFixed(2) +
        "</td>" +
        "</tr>" +
        '<tr class="totalDetalle">' +
        "<td>Incluye IVA cuando corresponda</td>";
    }
    //Fin

    body += "</tr></table></center></div>";
    console.log(body)
    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;}#infoRide img {width: " +
      databaseInfo.imgWidth +
      "; height: " +
      databaseInfo.imgHeight +
      "}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 0.5em;font-size: 0.7em} .totalDetalle>td{padding: 0.5em !important}</style>";
    var html = "<body>" + style + body + "</body>";
    fs.writeFileSync("test.html", html);
    pdf.create(html, options).toStream(function (err, stream) {
      if (!err) {
        stream.pipe(
          fs.createWriteStream(
            factura.infoTributaria[0].claveAcceso[0] + ".pdf"
          )
        );
        setTimeout(() => {
          try {
            fs.unlinkSync(factura.infoTributaria[0].claveAcceso[0] + ".pdf");
          } catch (err) { }
        }, 30000);
        return res.send(factura.infoTributaria[0].claveAcceso[0] + ".pdf");
      }
      return res.status(500).send();
    });
  });
};

ctrl.rideRetencion = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var comprobanteRetencion = result.comprobanteRetencion;
    comprobanteRetencion.infoTributaria[0].ambiente[0] =
      comprobanteRetencion.infoTributaria[0].ambiente[0] == "1"
        ? "PRUEBA"
        : "PRODUCCIÓN";
    comprobanteRetencion.infoTributaria[0].tipoEmision[0] =
      comprobanteRetencion.infoTributaria[0].tipoEmision[0] == "1"
        ? "NORMAL"
        : "";
    if (!comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido)
      comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido = [""];
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        comprobanteRetencion.infoTributaria[0].ruc[0],
        comprobanteRetencion.infoTributaria[0].estab[0],
        comprobanteRetencion.infoTributaria[0].ptoEmi[0]
      );
    imgSrc = path.normalize(imgSrc);
    //Generación de barcode clave de acceso
    let barcode = await utilities.getBarcode(
      comprobanteRetencion.infoTributaria[0].claveAcceso[0]
    );
    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(comprobanteRetencion);
    //Fin
    var contribuyenteEspecial = comprobanteRetencion.infoCompRetencion[0]
      .contribuyenteEspecial
      ? comprobanteRetencion.infoCompRetencion[0].contribuyenteEspecial[0]
      : "";
    var databaseInfo = utilities.getDatabaseInfoByRuc(
      comprobanteRetencion.infoTributaria[0].ruc[0],
      comprobanteRetencion.infoTributaria[0].estab[0],
      comprobanteRetencion.infoTributaria[0].ptoEmi[0]
    );

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      comprobanteRetencion.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      comprobanteRetencion.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">COMPROBANTE DE RETENCIÓN</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      comprobanteRetencion.infoTributaria[0].estab[0] +
      "-" +
      comprobanteRetencion.infoTributaria[0].ptoEmi[0] +
      "-" +
      comprobanteRetencion.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2"  style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      comprobanteRetencion.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td  style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      comprobanteRetencion.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      comprobanteRetencion.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      comprobanteRetencion.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      comprobanteRetencion.infoCompRetencion[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss")
        .add(-5, "hours")
        .format("YYYY-MM-DD HH:mm:ss") +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Contribuyente Especial: ' +
      contribuyenteEspecial +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      comprobanteRetencion.infoTributaria[0].ambiente[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Obligado a llevar contabilidad: ' +
      comprobanteRetencion.infoCompRetencion[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      comprobanteRetencion.infoTributaria[0].tipoEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="font-size: ' +
      leyenda_catastro.size +
      ';border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black">' +
      leyenda_catastro.text +
      '</td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td colspan="2" rowspan="2"></td><td style="padding-left: 2em;">' +
      comprobanteRetencion.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      barcode +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente"><tr ><td colspan="4"><span style="font-weight:bold">Razón Social / Nombres y Apellidos: </span>' +
      comprobanteRetencion.infoCompRetencion[0].razonSocialSujetoRetenido[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      comprobanteRetencion.infoCompRetencion[0]
        .identificacionSujetoRetenido[0] +
      '</td><td style="font-weight:bold">Fecha: Emisión: </td><td>' +
      comprobanteRetencion.infoCompRetencion[0].fechaEmision[0] +
      "</td></tr>" +
      "</table>" +
      '<table id="detalle" style="margin-top: 1em"><tr style="font-size: 0.6em ;background-color: #0d47a1;  color: white"><th style="padding: 0.7em">COMPROBANTE</th><th>NÚMERO</th><th>FECHA EMISIÓN</th><th>EJERCICIO FISCAL</th><th>BASE IMPONIBLE</th><th>IMPUESTO</th><th>PORCENTAJE DE RETENCIÓN</th><th>VALOR RETENIDO</th></tr>';
    comprobanteRetencion.impuestos[0].impuesto.forEach((i) => {
      var codDocSustento =
        typeof params.sri.codDocSustento[i.codDocSustento[0]] === "undefined"
          ? "OTROS"
          : params.sri.codDocSustento[i.codDocSustento[0]];
      body +=
        '<tr><td style="text-align: left">' +
        codDocSustento +
        "</td>" +
        "<td>" +
        i.numDocSustento[0] +
        "</td>" +
        '<td style="text-align: right">' +
        i.fechaEmisionDocSustento[0] +
        "</td>" +
        '<td style="text-align: right">' +
        comprobanteRetencion.infoCompRetencion[0].periodoFiscal[0] +
        "</td>" +
        '<td style="text-align: right">$ ' +
        i.baseImponible[0] +
        "</td>" +
        '<td style="text-align: right">' +
        params.sri.codImpuestoRetencion[i.codigo[0]] +
        "</td>" +
        '<td style="text-align: right">' +
        i.porcentajeRetener[0] +
        "</td>" +
        '<td style="text-align: right">$ ' +
        i.valorRetenido[0] +
        "</td></tr>";
    });

    //Sacar el valor total de retención
    var total = 0;

    comprobanteRetencion.impuestos[0].impuesto.forEach((i) => {
      total += parseFloat(i.valorRetenido[0]);
    });
    total = total.toFixed(2);

    body +=
      '<tr class="totalDetalle">' +
      '<td colspan="6" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Información Adicional</td>' +
      '<td style="background-color: #f5f5f5  ">TOTAL DE RETENCIÓN: </td>' +
      '<td style="text-align: right;background-color: #f5f5f5  ">$ ' +
      total +
      "</td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      '<td colspan="6" font-size: 0.9em">';

    if (comprobanteRetencion.infoAdicional) {
      comprobanteRetencion.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    body += "</tr></table></center></div>";

    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;} #infoRide img {width: " +
      databaseInfo.imgWidth +
      "; height: " +
      databaseInfo.imgHeight +
      "}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 1em;font-size: 0.7em}        .sinborde {     border: 1px solid transparent !important;}        .sinborde>td{    border: 1px solid transparent !important; padding-top: 0.2em !important} .cabecera{background-image: -webkit-linear-gradient(30deg, #212121 25%, #0277bd 25%);color: white;}</style>";
    var html = "<body>" + style + body + "</body>";

    pdf.create(html, options).toStream(function (err, stream) {
      if (!err) {
        stream.pipe(
          fs.createWriteStream(
            comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
          )
        );
        setTimeout(() => {
          try {
            fs.unlinkSync(
              comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
            );
          } catch (err) { }
        }, 30000);
        return res.send(
          comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
        );
      } else return res.status(500).send();
    });
  });
};

ctrl.rideRetencion2 = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var comprobanteRetencion = result.comprobanteRetencion;
    comprobanteRetencion.infoTributaria[0].ambiente[0] =
      comprobanteRetencion.infoTributaria[0].ambiente[0] == "1"
        ? "PRUEBA"
        : "PRODUCCIÓN";
    comprobanteRetencion.infoTributaria[0].tipoEmision[0] =
      comprobanteRetencion.infoTributaria[0].tipoEmision[0] == "1"
        ? "NORMAL"
        : "";
    if (!comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido)
      comprobanteRetencion.infoCompRetencion[0].direccionSujetoRetenido = [""];
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        comprobanteRetencion.infoTributaria[0].ruc[0],
        comprobanteRetencion.infoTributaria[0].estab[0],
        comprobanteRetencion.infoTributaria[0].ptoEmi[0]
      );
    imgSrc = path.normalize(imgSrc);
    //Generación de barcode clave de acceso
    let barcode = await utilities.getBarcode(
      comprobanteRetencion.infoTributaria[0].claveAcceso[0]
    );
    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(comprobanteRetencion);
    //Fin
    var contribuyenteEspecial = comprobanteRetencion.infoCompRetencion[0]
      .contribuyenteEspecial
      ? comprobanteRetencion.infoCompRetencion[0].contribuyenteEspecial[0]
      : "";
    var databaseInfo = utilities.getDatabaseInfoByRuc(
      comprobanteRetencion.infoTributaria[0].ruc[0],
      comprobanteRetencion.infoTributaria[0].estab[0],
      comprobanteRetencion.infoTributaria[0].ptoEmi[0]
    );

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      comprobanteRetencion.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      comprobanteRetencion.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">COMPROBANTE DE RETENCIÓN</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      comprobanteRetencion.infoTributaria[0].estab[0] +
      "-" +
      comprobanteRetencion.infoTributaria[0].ptoEmi[0] +
      "-" +
      comprobanteRetencion.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2"  style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      comprobanteRetencion.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td  style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      comprobanteRetencion.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      comprobanteRetencion.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      comprobanteRetencion.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      comprobanteRetencion.infoCompRetencion[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss")
        .add(-5, "hours")
        .format("YYYY-MM-DD HH:mm:ss") +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Contribuyente Especial: ' +
      contribuyenteEspecial +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      comprobanteRetencion.infoTributaria[0].ambiente[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Obligado a llevar contabilidad: ' +
      comprobanteRetencion.infoCompRetencion[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      comprobanteRetencion.infoTributaria[0].tipoEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="font-size: ' +
      leyenda_catastro.size +
      ';border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black">' +
      leyenda_catastro.text +
      '</td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td colspan="2" rowspan="2"></td><td style="padding-left: 2em;">' +
      comprobanteRetencion.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      barcode +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente"><tr ><td colspan="4"><span style="font-weight:bold">Razón Social / Nombres y Apellidos: </span>' +
      comprobanteRetencion.infoCompRetencion[0].razonSocialSujetoRetenido[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      comprobanteRetencion.infoCompRetencion[0]
        .identificacionSujetoRetenido[0] +
      '</td><td style="font-weight:bold">Fecha: Emisión: </td><td>' +
      comprobanteRetencion.infoCompRetencion[0].fechaEmision[0] +
      "</td></tr>" +
      "</table>" +
      '<table id="detalle" style="margin-top: 1em"><tr style="font-size: 0.6em ;background-color: #0d47a1;  color: white"><th style="padding: 0.7em">COMPROBANTE</th><th>NÚMERO</th><th>FECHA EMISIÓN</th><th>EJERCICIO FISCAL</th><th>BASE IMPONIBLE</th><th>IMPUESTO</th><th>PORCENTAJE DE RETENCIÓN</th><th>VALOR RETENIDO</th></tr>';
    comprobanteRetencion.docsSustento[0].docSustento[0].retenciones[0].retencion.forEach(
      (i) => {
        var docSustento = comprobanteRetencion.docsSustento[0].docSustento[0];
        var codDocSustento =
          typeof params.sri.codDocSustento[docSustento.codDocSustento[0]] ===
            "undefined"
            ? "OTROS"
            : params.sri.codDocSustento[docSustento.codDocSustento[0]];
        body +=
          '<tr><td style="text-align: left">' +
          codDocSustento +
          "</td>" +
          "<td>" +
          docSustento.numDocSustento[0] +
          "</td>" +
          '<td style="text-align: right">' +
          docSustento.fechaEmisionDocSustento[0] +
          "</td>" +
          '<td style="text-align: right">' +
          comprobanteRetencion.infoCompRetencion[0].periodoFiscal[0] +
          "</td>" +
          '<td style="text-align: right">$ ' +
          i.baseImponible[0] +
          "</td>" +
          '<td style="text-align: right">' +
          params.sri.codImpuestoRetencion[i.codigo[0]] +
          "</td>" +
          '<td style="text-align: right">' +
          i.porcentajeRetener[0] +
          "</td>" +
          '<td style="text-align: right">$ ' +
          i.valorRetenido[0] +
          "</td></tr>";
      }
    );

    //Sacar el valor total de retención
    var total = 0;

    comprobanteRetencion.docsSustento[0].docSustento[0].retenciones[0].retencion.forEach(
      (i) => {
        total += parseFloat(i.valorRetenido[0]);
      }
    );
    total = total.toFixed(2);

    body +=
      '<tr class="totalDetalle">' +
      '<td colspan="6" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Información Adicional</td>' +
      '<td style="background-color: #f5f5f5  ">TOTAL DE RETENCIÓN: </td>' +
      '<td style="text-align: right;background-color: #f5f5f5  ">$ ' +
      total +
      "</td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      '<td colspan="6" font-size: 0.9em">';

    if (comprobanteRetencion.infoAdicional) {
      comprobanteRetencion.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    body += "</tr></table></center></div>";

    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;} #infoRide img {width: " +
      databaseInfo.imgWidth +
      "; height: " +
      databaseInfo.imgHeight +
      "}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 1em;font-size: 0.7em}        .sinborde {     border: 1px solid transparent !important;}        .sinborde>td{    border: 1px solid transparent !important; padding-top: 0.2em !important} .cabecera{background-image: -webkit-linear-gradient(30deg, #212121 25%, #0277bd 25%);color: white;}</style>";
    var html = "<body>" + style + body + "</body>";

    pdf.create(html, options).toStream(function (err, stream) {
      if (!err) {
        stream.pipe(
          fs.createWriteStream(
            comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
          )
        );
        setTimeout(() => {
          try {
            fs.unlinkSync(
              comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
            );
          } catch (err) { }
        }, 30000);
        return res.send(
          comprobanteRetencion.infoTributaria[0].claveAcceso[0] + ".pdf"
        );
      } else return res.status(500).send();
    });
  });
};

ctrl.rideCredito = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var notaCredito = result.notaCredito;
    notaCredito.infoTributaria[0].ambiente[0] =
      notaCredito.infoTributaria[0].ambiente[0] == "1"
        ? "PRUEBA"
        : "PRODUCCIÓN";
    notaCredito.infoTributaria[0].tipoEmision[0] =
      notaCredito.infoTributaria[0].tipoEmision[0] == "1" ? "NORMAL" : "";
    if (!notaCredito.infoNotaCredito[0].direccionComprador)
      notaCredito.infoNotaCredito[0].direccionComprador = [""];
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        notaCredito.infoTributaria[0].ruc[0],
        notaCredito.infoTributaria[0].estab[0],
        notaCredito.infoTributaria[0].ptoEmi[0]
      );
    imgSrc = path.normalize(imgSrc);
    var contribuyenteEspecial = notaCredito.infoNotaCredito[0]
      .contribuyenteEspecial
      ? notaCredito.infoNotaCredito[0].contribuyenteEspecial[0]
      : "";
    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(notaCredito);
    //Fin
    var databaseInfo = utilities.getDatabaseInfoByRuc(
      notaCredito.infoTributaria[0].ruc[0],
      notaCredito.infoTributaria[0].estab[0],
      notaCredito.infoTributaria[0].ptoEmi[0]
    );
    let barcode = await utilities.getBarcode(
      notaCredito.infoTributaria[0].claveAcceso[0]
    );

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      notaCredito.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      notaCredito.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">NOTA DE CRÉDITO</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      notaCredito.infoTributaria[0].estab[0] +
      "-" +
      notaCredito.infoTributaria[0].ptoEmi[0] +
      "-" +
      notaCredito.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2"  style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      notaCredito.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td  style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      notaCredito.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      notaCredito.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      notaCredito.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      notaCredito.infoNotaCredito[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss")
        .add(-5, "hours")
        .format("YYYY-MM-DD HH:mm:ss") +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Contribuyente Especial: ' +
      contribuyenteEspecial +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      notaCredito.infoTributaria[0].ambiente[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black">Obligado a llevar contabilidad: ' +
      notaCredito.infoNotaCredito[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      notaCredito.infoTributaria[0].tipoEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black;border-bottom: 1px solid black;font-size: ' +
      leyenda_catastro.size +
      '">' +
      leyenda_catastro.text +
      '</td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td colspan="2" rowspan="2"></td><td style="padding-left: 2em;">' +
      notaCredito.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      barcode +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente"><tr ><td style="font-weight:bold">Razón Social / Nombres y Apellidos: </td><td>' +
      notaCredito.infoNotaCredito[0].razonSocialComprador[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      notaCredito.infoNotaCredito[0].identificacionComprador[0] +
      ' <span style="font-weight:bold"> Fecha: Emisión: </span><span>' +
      notaCredito.infoNotaCredito[0].fechaEmision[0] +
      "</span></td></tr>" +
      '<tr><td style="font-weight:bold">Dirección: </td><td>' +
      notaCredito.infoNotaCredito[0].direccionComprador[0] +
      "</td></tr>" +
      '<tr style="border-top= 1px black solid"><td style="font-weight: bold">Comprobante que se modifica: </td><td>' +
      params.sri.codDocSustento[
      notaCredito.infoNotaCredito[0].codDocModificado[0]
      ] +
      " | " +
      notaCredito.infoNotaCredito[0].numDocModificado[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">Fecha emisión (Comprobante a modificar) : </td><td>' +
      notaCredito.infoNotaCredito[0].fechaEmisionDocSustento[0] +
      "</td></tr>" +
      '<tr><td style="font-weight: bold">Razón de modificación: </td><td>' +
      notaCredito.infoNotaCredito[0].motivo[0] +
      "</td></tr>" +
      "</table>" +
      '<table id="detalle" style="margin-top: 1em"><tr style="font-size: 0.9em; background-color: #0d47a1;  color: white"><th style="padding: 0.7em">COD</th><th>COD. AUX.</th><th>DESCRIPCIÓN</th><th>CANT.</th><th>P. UNITARIO</th><th>TOTAL ÍTEM</th></tr>';

    notaCredito.detalles[0].detalle.forEach((i) => {
      body +=
        "<tr ><td>" +
        i.codigoInterno[0] +
        "</td>" +
        "<td>" +
        i.codigoAdicional[0] +
        "</td>" +
        "<td>" +
        i.descripcion[0] +
        "</td>" +
        '<td style="text-align: right"> ' +
        i.cantidad[0] +
        "</td>" +
        '<td style="text-align: right">$ ' +
        i.precioUnitario[0] +
        "</td>" +
        '<td style="text-align: right">$ ' +
        i.precioTotalSinImpuesto[0] +
        "</td>" +
        "</tr>";
    });

    body +=
      '<tr class="totalDetalle">' +
      '<td colspan="4" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Información Adicional</td>' +
      '<td colspan="2" style="background-color: #eeeeee"><span style="float: left; font-weight: bold">SUBTOTAL</span><span style="float: right; padding-right: 0.5em">$ ' +
      notaCredito.infoNotaCredito[0].totalSinImpuestos[0] +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      '<td colspan="4" font-size: 0.9em">';

    if (notaCredito.infoAdicional) {
      notaCredito.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    body += "</td>" + '<td colspan="2" style="background-color: #eeeeee ">';

    notaCredito.infoNotaCredito[0].totalConImpuestos[0].totalImpuesto.forEach(
      (i) => {
        body +=
          '<span style="font-weight:bold; float: left">IVA ' +
          params.sri.tarifaIVA[i.codigoPorcentaje[0]] +
          ' </span><span style="float: right; padding-right: 0.5em">$ ' +
          i.valor[0] +
          "</span><br>";
      }
    );

    body +=
      '</td></tr><tr class="totalDetalle"><td colspan="4"></td><td colspan="2" style="background-color: #eeeeee "><span style="font-weight:bold; float: left">VALOR TOTAL: </span><span style="float: right; padding-right: 0.5em">$ ' +
      notaCredito.infoNotaCredito[0].valorModificacion[0] +
      "</span><br>";
    body += "</td></tr></table></center></div>";
    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;}#infoRide img {width: " +
      databaseInfo.imgWidth +
      "; height: " +
      databaseInfo.imgHeight +
      "}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 1em;font-size: 0.7em} .totalDetalle>td{padding: 0.5em !important}</style>";
    var html = "<body>" + style + body + "</body>";

    pdf.create(html, options).toStream(function (err, stream) {
      stream.pipe(
        fs.createWriteStream(
          "./" + notaCredito.infoTributaria[0].claveAcceso[0] + ".pdf"
        )
      );
      setTimeout(() => {
        try {
          fs.unlinkSync(notaCredito.infoTributaria[0].claveAcceso[0] + ".pdf");
        } catch (err) {
          console.error(err);
        }
      }, 30000);
      return res.send(notaCredito.infoTributaria[0].claveAcceso[0] + ".pdf");
    });
  });
};

ctrl.rideDebito = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var notaDebito = result.notaDebito;
    notaDebito.infoTributaria[0].ambiente[0] =
      notaDebito.infoTributaria[0].ambiente[0] == "1" ? "PRUEBA" : "PRODUCCIÓN";
    notaDebito.infoTributaria[0].tipoEmision[0] =
      notaDebito.infoTributaria[0].tipoEmision[0] == "1" ? "NORMAL" : "";
    if (!notaDebito.infoNotaDebito[0].direccionComprador)
      notaDebito.infoNotaDebito[0].direccionComprador = [""];
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(notaDebito.infoTributaria[0].ruc[0]);
    imgSrc = path.normalize(imgSrc);

    var canvas = Canvas.createCanvas();
    JsBarcode(canvas, notaDebito.infoTributaria[0].claveAcceso[0], {
      width: 4,
      height: 40,
      displayValue: false,
    });

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      notaDebito.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      notaDebito.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">NOTA DE CRÉDITO</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      notaDebito.infoTributaria[0].estab[0] +
      "-" +
      notaDebito.infoTributaria[0].ptoEmi[0] +
      "-" +
      notaDebito.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2"  style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      notaDebito.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td  style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      notaDebito.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      notaDebito.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      notaDebito.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      notaDebito.infoNotaDebito[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss").format(
        "YYYY-MM-DD HH:mm:ss"
      ) +
      "</td></tr>" +
      '<tr><td colspan="2" rowspan="2" style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black">Obligado a llevar contabilidad: ' +
      notaDebito.infoNotaDebito[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      notaDebito.infoTributaria[0].ambiente[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      notaDebito.infoTributaria[0].tipoEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="2" rowspan="3"></td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td style="padding-left: 2em;">' +
      notaDebito.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      canvas.toDataURL("image/png") +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente"><tr ><td style="font-weight:bold">Razón Social / Nombres y Apellidos: </td><td>' +
      notaDebito.infoNotaDebito[0].razonSocialComprador[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      notaDebito.infoNotaDebito[0].identificacionComprador[0] +
      ' <span style="font-weight:bold"> Fecha: Emisión: </span><span>' +
      notaDebito.infoNotaDebito[0].fechaEmision[0] +
      "</span></td></tr>" +
      '<tr><td style="font-weight:bold">Dirección: </td><td>' +
      notaDebito.infoNotaDebito[0].direccionComprador[0] +
      "</td></tr>" +
      '<tr style="border-top= 1px black solid"><td style="font-weight: bold">Comprobante que se modifica: </td><td>' +
      params.sri.codDocSustento[
      notaDebito.infoNotaDebito[0].codDocModificado[0]
      ] +
      " | " +
      notaDebito.infoNotaDebito[0].numDocModificado[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">Fecha emisión (Comprobante a modificar) : </td><td>' +
      notaDebito.infoNotaDebito[0].fechaEmisionDocSustento[0] +
      "</td></tr>" +
      "</table>" +
      '<table id="detalle" style="margin-top: 1em"><tr style="font-size: 0.9em; background-color: #0d47a1;  color: white"><th style="padding: 0.7em">RAZÓN DE LA MODIFICACIÓN</th><th>VALOR</th></tr>';

    var total = 0;

    notaDebito.motivos[0].motivo.forEach((i) => {
      total += parseFloat(i.valor[0]);
      body +=
        "<tr ><td>" +
        i.razon[0] +
        "</td>" +
        '<td style="text-align:right">' +
        i.valor[0] +
        "</td>" +
        "</tr>";
    });

    body +=
      '<tr class="totalDetalle">' +
      '<td  style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Información Adicional</td>' +
      '<td  style="background-color: #eeeeee"><span style="float: left; font-weight: bold">SUBTOTAL</span><span style="float: right; padding-right: 0.5em">$ ' +
      notaDebito.infoNotaDebito[0].totalSinImpuestos[0] +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      '<td  font-size: 0.9em">';

    if (notaDebito.infoAdicional) {
      notaDebito.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    body += "</td>" + '<td style="background-color: #eeeeee ">';

    notaDebito.infoNotaDebito[0].impuestos[0].impuesto.forEach((i) => {
      body +=
        '<span style="font-weight:bold; float: left">IVA ' +
        params.sri.tarifaIVA[i.codigoPorcentaje[0]] +
        ' </span><span style="float: right; padding-right: 0.5em">$ ' +
        i.valor[0] +
        "</span><br>";
    });

    body +=
      '</td></tr><tr class="totalDetalle"><td></td><td colspan="2" style="background-color: #eeeeee "><span style="font-weight:bold; float: left">VALOR TOTAL: </span><span style="float: right; padding-right: 0.5em">$ ' +
      total.toFixed(2) +
      "</span><br>";
    body += "</td></tr></table></center></div>";
    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;}#infoRide img {width: 50%; height: auto}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 1em;font-size: 0.7em} .totalDetalle>td{padding: 0.5em !important}</style>";
    var html = "<body>" + style + body + "</body>";

    pdf.create(html, options).toStream(function (err, stream) {
      if (!err) {
        stream.pipe(
          fs.createWriteStream(
            notaDebito.infoTributaria[0].claveAcceso[0] + ".pdf"
          )
        );
        setTimeout(() => {
          try {
            fs.unlinkSync(notaDebito.infoTributaria[0].claveAcceso[0] + ".pdf");
          } catch (err) { }
        }, 30000);
        return res.send(notaDebito.infoTributaria[0].claveAcceso[0] + ".pdf");
      }
      return res.status(500).send();
    });
  });
};

ctrl.rideRemision = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var guiaRemision = result.guiaRemision;
    guiaRemision.infoTributaria[0].ambiente[0] =
      guiaRemision.infoTributaria[0].ambiente[0] == "1"
        ? "PRUEBA"
        : "PRODUCCIÓN";
    guiaRemision.infoTributaria[0].tipoEmision[0] =
      guiaRemision.infoTributaria[0].tipoEmision[0] == "1" ? "NORMAL" : "";
    if (!guiaRemision.infoGuiaRemision[0].direccionComprador)
      guiaRemision.infoGuiaRemision[0].direccionComprador = [""];

    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        guiaRemision.infoTributaria[0].ruc[0],
        guiaRemision.infoTributaria[0].estab[0],
        guiaRemision.infoTributaria[0].ptoEmi[0]
      );
    imgSrc = path.normalize(imgSrc);
    let barcode = await utilities.getBarcode(
      guiaRemision.infoTributaria[0].claveAcceso[0]
    );

    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(guiaRemision);
    //Fin

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      guiaRemision.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      guiaRemision.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">GUÍA DE REMISIÓN</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      guiaRemision.infoTributaria[0].estab[0] +
      "-" +
      guiaRemision.infoTributaria[0].ptoEmi[0] +
      "-" +
      guiaRemision.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2"  style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      guiaRemision.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      guiaRemision.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      guiaRemision.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      guiaRemision.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      guiaRemision.infoGuiaRemision[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss")
        .add(-5, "hours")
        .format("YYYY-MM-DD HH:mm:ss") +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black">Obligado a llevar contabilidad: ' +
      guiaRemision.infoGuiaRemision[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      guiaRemision.infoTributaria[0].ambiente[0] +
      "</td></tr>" +
      '<tr><td colspan="2" style="font-size: ' +
      leyenda_catastro.size +
      '">' +
      leyenda_catastro.text +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      guiaRemision.infoTributaria[0].tipoEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="2" rowspan="3"></td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td style="padding-left: 2em;">' +
      guiaRemision.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      barcode +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente">' +
      '<tr><td style="font-weight:bold">Razón Social / Nombres y Apellidos: </td><td colspan="3">' +
      guiaRemision.infoGuiaRemision[0].razonSocialTransportista[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      guiaRemision.infoGuiaRemision[0].rucTransportista[0] +
      '</td><td style="font-weight:bold"> Placa: </td><td>' +
      guiaRemision.infoGuiaRemision[0].placa[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">Dirección de Partida: </td><td colspan="3">' +
      guiaRemision.infoGuiaRemision[0].dirPartida[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">Fecha de Inicio:</td><td>' +
      guiaRemision.infoGuiaRemision[0].fechaIniTransporte[0] +
      '</td><td style="font-weight:bold"> Fecha de Fin: </td><td>' +
      guiaRemision.infoGuiaRemision[0].fechaFinTransporte[0] +
      "</td></tr>" +
      "</table>";

    guiaRemision.destinatarios[0].destinatario.forEach((i) => {
      var codDocSustento = i.codDocSustento
        ? params.sri.codDocSustento[i.codDocSustento[0]]
        : "";
      var fechaEmisionDocSustento = i.fechaEmisionDocSustento
        ? i.fechaEmisionDocSustento[0]
        : "";
      var numAutDocSustento = i.numAutDocSustento ? i.numAutDocSustento : "";
      var numDocSustento = i.numDocSustento ? i.numDocSustento[0] : "";
      var ruta = i.ruta ? i.ruta[0] : "";
      var motivoTraslado = i.motivoTraslado ? i.motivoTraslado[0] : "";

      body +=
        '<div style="border: 0.1em gray solid; width: 90%; padding-top: 1em; padding-bottom: 1em; margin-top: 1em"><table id="infoCliente">' +
        '<tr><td style="font-weight:bold">Tipo:</td><td>' +
        codDocSustento +
        '</td><td style="font-weight:bold"> Fecha de Emisión: </td><td>' +
        fechaEmisionDocSustento +
        "</td></tr>" +
        '<tr><td style="font-weight:bold">Autorización:</td><td>' +
        numAutDocSustento +
        '</td> <td style="font-weight:bold"> Secuencial: </td><td>' +
        numDocSustento +
        "</td></tr>" +
        '<tr><td style="font-weight:bold">Destinatario:</td><td>' +
        i.razonSocialDestinatario[0] +
        '</td> <td style="font-weight:bold"> RUC/CI: </td><td>' +
        i.identificacionDestinatario[0] +
        "</td></tr>" +
        '<tr><td style="font-weight:bold">Dirección Destinatario: </td><td colspan="3">' +
        i.dirDestinatario[0] +
        "</td></tr>" +
        '<tr><td style="font-weight:bold">Ruta:</td><td>' +
        i.ruta[0] +
        '</td><td style="font-weight:bold"> Motivo: </td><td>' +
        i.motivoTraslado[0] +
        "</td></tr>" +
        "</table>" +
        '<table class="detalle" style="margin-top: 1em"><tr style="font-size: 0.9em; background-color: #0d47a1;  color: white"><th style="padding: 0.7em">CÓDIGO INTERNO</th><th>DESCRIPCIÓN</th><th>CANTIDAD</th></tr>';

      i.detalles[0].detalle.forEach((j) => {
        body +=
          "<tr ><td>" +
          j.codigoInterno[0] +
          "</td>" +
          "<td>" +
          j.descripcion[0] +
          "</td>" +
          '<td style="text-align: right">' +
          j.cantidad[0] +
          "</td>" +
          "</tr>";
      });
      body += "</table></div>";
    });

    body +=
      '<table class="detalle" style="margin-top: 1em"><tr class="totalDetalle">' +
      '<td style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1; text-align: center " >Información Adicional</td></tr>' +
      '<tr class="totalDetalle" >' +
      '<td style=" font-size: 0.9em; text-align: center">';

    if (guiaRemision.infoAdicional) {
      guiaRemision.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    body += "</td></tr></table></center></div>";
    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;}#infoRide img {width: 50%; height: auto}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        .detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }.detalle tr {    border: 1px solid #ddd;}.detalle td {    border: 1px solid #ddd;padding: 1em;font-size: 0.7em} .totalDetalle>td{padding: 0.5em !important}</style>";
    var html = "<body>" + style + body + "</body>";

    pdf.create(html, options).toStream(function (err, stream) {
      stream.pipe(
        fs.createWriteStream(
          "./" + guiaRemision.infoTributaria[0].claveAcceso[0] + ".pdf"
        )
      );
      setTimeout(() => {
        try {
          fs.unlinkSync(guiaRemision.infoTributaria[0].claveAcceso[0] + ".pdf");
        } catch (err) {
          console.error(err);
        }
      }, 30000);
      return res.send(guiaRemision.infoTributaria[0].claveAcceso[0] + ".pdf");
    });
  });
};

ctrl.rideLiquidacion = (req, res) => {
  var options = params.optionsRIDE;
  parseString(req.body.xml, async (err, result) => {
    var liquidacionCompra = result.liquidacionCompra;
    var ambiente =
      liquidacionCompra.infoTributaria[0].ambiente[0] == "1"
        ? "PRUEBA"
        : "PRODUCCIÓN";
    var tipoEmision =
      liquidacionCompra.infoTributaria[0].tipoEmision[0] == "1" ? "NORMAL" : "";
    var direccionProveedor = liquidacionCompra.infoLiquidacionCompra[0]
      .direccionProveedor
      ? liquidacionCompra.infoLiquidacionCompra[0].direccionProveedor[0]
      : "";
    var imgSrc =
      "file://" +
      __dirname +
      "../../public/img/" +
      utilities.getLogoByRuc(
        liquidacionCompra.infoTributaria[0].ruc[0],
        liquidacionCompra.infoTributaria[0].estab[0],
        liquidacionCompra.infoTributaria[0].ptoEmi[0]
      );
    imgSrc = path.normalize(imgSrc);

    //Parametrización de la leyenda del catastro
    var leyenda_catastro = utilities.getLeyendaCatastro(liquidacionCompra);
    //Fin

    let barcode = await utilities.getBarcode(
      liquidacionCompra.infoTributaria[0].claveAcceso[0]
    );
    //Validar show de detAdicional: -1 no mostrar nada, 0 mostrar todo, 1 mostrar el ultimo
    var detAdicional = params.RIDE.optionalItems.detAdicional.status
      ? params.RIDE.optionalItems.detAdicional.mode
      : -1;

    var body =
      '<div id="pageContent"><center><table id="infoRide"><tr>' +
      '<td rowspan="4"><img src="' +
      imgSrc +
      '"></td><td style="font-size: 1em; color: #2239ff">' +
      liquidacionCompra.infoTributaria[0].nombreComercial[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1em">R.U.C.: ' +
      liquidacionCompra.infoTributaria[0].ruc[0] +
      "</td></tr>" +
      '<tr><td style="font-size: 1.1em; background-color: black; color: white">LIQUIDACIÓN DE COMPRA</td></tr>' +
      '<tr><td style="font-size: 1em; color:#3583ea">' +
      liquidacionCompra.infoTributaria[0].estab[0] +
      "-" +
      liquidacionCompra.infoTributaria[0].ptoEmi[0] +
      "-" +
      liquidacionCompra.infoTributaria[0].secuencial[0] +
      "</td></tr></table>" +
      '<table id="infoEmpresa" cellspacing="0"><tr><td colspan="2" style="border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black">' +
      liquidacionCompra.infoTributaria[0].razonSocial[0] +
      '</td><td style="padding-left: 2em; font-weight:bold">Número de autorización:</td></tr>' +
      '<tr><td  style="border-left: 1px solid black; font-weight:bold">Matriz</td><td style="border-right: 1px solid black">' +
      liquidacionCompra.infoTributaria[0].dirMatriz[0] +
      '</td><td style="padding-left: 2em">' +
      liquidacionCompra.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="border-left: 1px solid black; font-weight:bold">Suc. (' +
      liquidacionCompra.infoTributaria[0].estab[0] +
      ')</td><td style="border-right: 1px solid black">' +
      liquidacionCompra.infoLiquidacionCompra[0].dirEstablecimiento[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Fecha y hora de autorización: </span>' +
      moment(req.params.fechaAutorizacion, "YYYY-MM-DDTHH:mm:ss")
        .add(-5, "hours")
        .format("YYYY-MM-DD HH:mm:ss") +
      "</td></tr>" +
      '<tr><td colspan="2" style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black">Obligado a llevar contabilidad: ' +
      liquidacionCompra.infoLiquidacionCompra[0].obligadoContabilidad[0] +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Ambiente: </span>' +
      ambiente +
      "</td></tr>" +
      '<tr><td colspan="2" style="font-size: ' +
      leyenda_catastro.size +
      '">' +
      leyenda_catastro.text +
      '</td><td style="padding-left: 2em"><span style="font-weight:bold">Emisión: </span>' +
      tipoEmision +
      "</td></tr>" +
      '<tr><td colspan="2" rowspan="3"></td><td style="padding-left: 2em; font-weight:bold">Clave de acceso:</td></tr>' +
      '<tr><td style="padding-left: 2em;">' +
      liquidacionCompra.infoTributaria[0].claveAcceso[0] +
      "</td></tr>" +
      '<tr><td style="padding-left: 2em"><img src="' +
      barcode +
      '" style="width: 30em" align:right ></img></td></tr></table>' +
      '<table id="infoCliente"><tr ><td colspan="4"><span style="font-weight:bold">Razón Social / Nombres y Apellidos: </span>' +
      liquidacionCompra.infoLiquidacionCompra[0].razonSocialProveedor[0] +
      "</td></tr>" +
      '<tr><td style="font-weight:bold">RUC /CI:</td><td>' +
      liquidacionCompra.infoLiquidacionCompra[0].identificacionProveedor[0] +
      '</td><td style="font-weight:bold">Fecha: Emisión: </td><td>' +
      liquidacionCompra.infoLiquidacionCompra[0].fechaEmision[0] +
      "</td></tr>" +
      '<tr><td colspan="4"><span style="font-weight:bold">Dirección: </span>' +
      direccionProveedor +
      "</td></tr></table>" +
      '<table id="detalle" style="margin-top: 1em"><tr style="font-size: 0.9em; background-color: #0d47a1;  color: white"><th style="padding: 0.7em">' +
      params.RIDE.name.codigoPrincipal +
      "</th>";
    body += params.RIDE.optionalItems.codigoAuxiliar
      ? "<th>" + params.RIDE.name.codigoAuxiliar + "</th>"
      : "";
    body += "<th>" + params.RIDE.name.descripcion + "</th>";
    if (detAdicional == 0)
      params.RIDE.optionalItems.detAdicional.names.forEach(
        (i) => (body += "<th>" + i + "</th>")
      );
    body +=
      "<th>" +
      params.RIDE.name.cantidad +
      "</th><th>" +
      params.RIDE.name.precioUnitario +
      "</th><th>" +
      params.RIDE.name.precioTotal +
      "</th></tr>";

    liquidacionCompra.detalles[0].detalle.forEach((i) => {
      body +=
        '<tr ><td style="text-align: left; font-size: 0.7em">' +
        i.codigoPrincipal[0] +
        "</td>";
      if (params.RIDE.optionalItems.codigoAuxiliar)
        body += i.codigoAuxiliar
          ? '<td style="font-size: .7em">' + i.codigoAuxiliar[0] + "</td>"
          : "<td></td>";
      body += '<td style="font-size: .8em">' + i.descripcion[0] + "</td>";
      if (detAdicional == 0)
        for (
          var j = 0;
          j < params.RIDE.optionalItems.detAdicional.names.length;
          j++
        ) {
          if (i.detallesAdicionales)
            body += i.detallesAdicionales[0].detAdicional[j]
              ? '<td style="font-size: .8em">' +
              i.detallesAdicionales[0].detAdicional[j]["$"].valor +
              "</td>"
              : "<td></td>";
          else body += "<td></td>";
        }
      body +=
        '<td style="text-align: right">' +
        parseFloat(i.cantidad[0]).toFixed(2) +
        "</td>" +
        '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
        parseFloat(i.precioUnitario[0]).toFixed(2) +
        "</span></td>" +
        '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
        (
          parseFloat(i.precioTotalSinImpuesto[0]) + parseFloat(i.descuento[0])
        ).toFixed(2) +
        "</span></td></tr>";
    });

    //Sacar totales
    var subtotal12 = 0.0;
    var subtotal0 = 0.0;
    var iva = 0.0;
    var ice = 0.0;
    liquidacionCompra.infoLiquidacionCompra[0].totalConImpuestos[0].totalImpuesto.forEach(
      (i) => {
        if (i.codigo == "2" && i.codigoPorcentaje == "2") {
          iva = parseFloat(i.valor);
          subtotal12 = parseFloat(i.baseImponible);
        } else if (i.codigo == "2") subtotal0 = parseFloat(i.baseImponible);
        else if (i.codigo == "3") ice = parseFloat(i.baseImponible);
      }
    );

    var colspan = utilities.getColspan();
    var rowspan = utilities.getRowspan();

    body +=
      '<tr class="totalDetalle">' +
      '<td colspan="' +
      (3 + colspan) +
      '" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Información Adicional</td>' +
      '<td style="background-color: #f5f5f5  ">SUBTOTAL(0%)</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
      subtotal0.toFixed(2) +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      "<td rowspan=" +
      (5 + rowspan) +
      ' colspan="' +
      (3 + colspan) +
      '" font-size: 0.9em">';
    if (detAdicional == 1)
      if (liquidacionCompra.infoAdicional)
        liquidacionCompra.infoAdicional[0].campoAdicional.push({
          $: { nombre: "Descripcion" },
          _: liquidacionCompra.detalles[0].detalle[
            liquidacionCompra.detalles[0].detalle.length - 1
          ].detallesAdicionales[0].detAdicional[0]["$"].valor,
        });
      else if (
        liquidacionCompra.detalles[0].detalle[
          liquidacionCompra.detalles[0].detalle.length - 1
        ].detallesAdicionales
      )
        liquidacionCompra.infoAdicional = [
          {
            campoAdicional: [
              {
                $: { nombre: "Descripcion" },
                _: liquidacionCompra.detalles[0].detalle[
                  liquidacionCompra.detalles[0].detalle.length - 1
                ].detallesAdicionales[0].detAdicional[0]["$"].valor,
              },
            ],
          },
        ];

    if (liquidacionCompra.infoAdicional) {
      liquidacionCompra.infoAdicional[0].campoAdicional.forEach((i) => {
        body +=
          '<span style="color:#0d47a1  ">-' +
          i["$"].nombre +
          ": </span><br>" +
          i["_"] +
          "<br>";
      });
    }

    //Validación de propina
    if (params.RIDE.optionalItems.propina.status)
      body +=
        '</td><td style="background-color: #f5f5f5  ">' +
        params.RIDE.optionalItems.propina.name +
        "</td>" +
        '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
        parseFloat(liquidacionCompra.infoLiquidacionCompra[0].propina[0]) +
        "</td>" +
        '</tr><tr class="totalDetalle">';

    body +=
      "</td>" +
      '<td style="background-color: #f5f5f5  ">SUBTOTAL(12%)</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
      subtotal12 +
      "</span></td>" +
      "</tr>" +
      "</td>" +
      '<td style="background-color: #f5f5f5  ">DESCUENTO</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
      liquidacionCompra.infoLiquidacionCompra[0].totalDescuento[0] +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle"><td style="background-color: #f5f5f5  ">IVA</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
      iva +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle"><td style="background-color: #f5f5f5  ">ICE</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5"> ' +
      ice.toFixed(2) +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle"><td style="background-color: #f5f5f5; font-weight:bold  ">TOTAL</td>' +
      '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5; font-weight:bold"> ' +
      liquidacionCompra.infoLiquidacionCompra[0].importeTotal[0] +
      "</span></td>" +
      "</tr>" +
      '<tr class="totalDetalle">' +
      '<td colspan="' +
      (3 + colspan) +
      '" style="color: #0d47a1 ; font-size: 0.9em; color: #0d47a1 ">Forma de pago: </td>' +
      "</tr>" +
      '<tr class="totalDetalle">';
    if (liquidacionCompra.infoLiquidacionCompra[0].pagos) {
      liquidacionCompra.infoLiquidacionCompra[0].pagos[0].pago.forEach((i) => {
        body +=
          '<td colspan="' +
          (2 + colspan) +
          '">' +
          params.sri.formaPago[i.formaPago[0]] +
          "</td>" +
          '<td><span style="text-align:left">$</span><span style="float: right; background-color: #f5f5f5">' +
          i.total[0] +
          "</span></td>";
      });
    }
    body += "</tr></center></div>";
    var style =
      "<style>body {  font-family: Arial, Helvetica, sans-serif;} #pageContent{margin-top: 0.5em} #infoRide{text-align: center; width: 90%;}#infoRide img {width: 50%; height: auto}        #infoRide td{width: 50%; padding-left: 1em; padding-right: 1em}        #infoEmpresa {width: 90%; font-size:0.8em}        #infoCliente {width: 90%; border: 1px solid black;border-radius: 0.5em;font-size:0.8em}        #detalle {    border: 1px solid #ddd;border-collapse: collapse;width: 90%; }#detalle tr {    border: 1px solid #ddd;}#detalle td {    border: 1px solid #ddd;padding: 0.5em;font-size: 0.7em} .totalDetalle>td{padding: 0.5em !important}</style>";
    var html = "<body>" + style + body + "</body>";
    fs.writeFileSync("test.html", html);
    pdf.create(html, options).toStream(function (err, stream) {
      if (!err) {
        stream.pipe(
          fs.createWriteStream(
            liquidacionCompra.infoTributaria[0].claveAcceso[0] + ".pdf"
          )
        );
        setTimeout(() => {
          try {
            fs.unlinkSync(
              liquidacionCompra.infoTributaria[0].claveAcceso[0] + ".pdf"
            );
          } catch (err) { }
        }, 30000);
        return res.send(
          liquidacionCompra.infoTributaria[0].claveAcceso[0] + ".pdf"
        );
      }
      return res.status(500).send();
    });
  });
};

module.exports = ctrl;
