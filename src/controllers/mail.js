const moment = require('moment')
const express = require('express');
const Sybase = require('sybase');
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios')
const nodemailer = require('nodemailer');
const parseString = require('xml2js').parseStringPromise;
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const params = require('../libs/params');
const utilities = require('../libs/utilities');
const WhatsAppGenesis = require("../services/whatsApp/WhatsAppGenesis");
const querySybase = require("../helpers/querySybase");

var ctrl = {};

ctrl.mail = (req = express.request, res) => {
  const connection = utilities.dbConnection(req.params.db);

  var query = `SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador,
    empresa,
    (case when ce_comprobante.tipo_comprobante='FV' OR ce_comprobante.tipo_comprobante='NC' OR ce_comprobante.tipo_comprobante='GR'  then  (SELECT first cl.telefono  FROM in_cliente  cl WHERE cl.cedula_ruc = ruc_comprador AND cl.empresa = ce_comprobante.empresa  ) else (SELECT first LEFT(pl.telefono,9)  FROM in_proveedor  pl WHERE pl.cedula = ruc_comprador AND pl.empresa = ce_comprobante.empresa  ) end ) as telefono
  FROM ce_comprobante WHERE ce_id =  '${req.params.ce_id}'
  `;
  let db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);

  let pdfBuffer = "";
  let ruta = "";
  let html = null;
  let telefono = "";
  db.connect(async (err) => {
    // Trayendo datos de la factura
    const dataCE = await querySybase(db, query);
    telefono = dataCE[0].telefono;

    // Creando pdf
    const result = await parseString(dataCE[0].ce_xml);

    try {
      var tipo_comprobante = Object.keys(result)[0];
      var tipo = "";
      switch (tipo_comprobante) {
        case "factura":
          tipo = "factura";
          break;
        case "liquidacionCompra":
          tipo = "liquidacion";
          break;
        case "notaCredito":
          tipo = "credito";
          break;
        case "notaDebito":
          tipo = "debito";
          break;
        case "guiaRemision":
          tipo = "remision";
          break;
        case "comprobanteRetencion":
          if (parseFloat(result[tipo_comprobante]["$"].version) >= 2)
            tipo = "retencion2";
          else tipo = "retencion";
          break;
      }
      let mail = utilities.getMailByRuc(result[tipo_comprobante].infoTributaria[0].ruc);
      let pdf = await axios.post("http://localhost:" + params.port + "/api/documento/ride/" + tipo + "/" + dataCE[0].fecha_autorizacion, { xml: dataCE[0].ce_xml });

      //Verificacion de método OAuth2
      if (mail.auth.type == "OAuth2") {
        const OAuth2Client = new google.auth.OAuth2(
          mail.auth.clientId,
          mail.auth.clientSecret,
          "https://developers.google.com/oauthplayground"
        );
        OAuth2Client.setCredentials({
          refresh_token: mail.auth.refreshToken,
          tls: {
            rejectUnauthorized: false,
          },
        });
        mail.auth.accessToken = await OAuth2Client.getAccessToken();
      }
      //Fin
      var transporter = nodemailer.createTransport(mail);
      var to = req.params.mails.split(",");
      var secuencial =
        result[tipo_comprobante].infoTributaria[0].estab +
        "-" +
        result[tipo_comprobante].infoTributaria[0].ptoEmi +
        "-" +
        result[tipo_comprobante].infoTributaria[0].secuencial;
      html = params.mailTemplate;
      html = html.replace("%facturonURL%", params.facturonURL);
      html = html.replace("%cliente%", dataCE[0].nombre_comprador);
      html = html.replace("%fecha%", moment(dataCE[0].fecha_autorizacion, "YYYY-MM-DDTHH:mm:ss").format("DD-MM-YYYY"));
      html = html.replace("%valor%", utilities.getValorFromXml(result));
      html = html.replace("%tipo_comprobante%", tipo.toUpperCase());
      const mailOptions = {
        from: mail.auth.user,
        to,
        subject:
          "📝 " +
          tipo.toUpperCase() +
          " - " +
          dataCE[0].nombre_comprador +
          ", FACTURACIÓN ELECTRÓNICA " +
          secuencial,
        html,
        attachments: [
          {
            filename: secuencial + ".pdf",
            path: __dirname + "../../../" + pdf.data,
            contentType: "application/pdf",
          },
          {
            filename: secuencial + ".xml",
            content: new Buffer(dataCE[0].xml_autorizado, "utf-8"),
          },
        ],
      };
      ruta = pdf.data;
      if (to != "undefined") {
        transporter.sendMail(mailOptions, function (error, info) {
          try {
            if (
              error &&
              error.responseCode != 501 &&
              error.toString() != "Error: No recipients defined"
            )
              console.error(error);
            else {
              console.error(info ? info : "Correo receptor mal ingresado");

            }
            return res.send();
          } catch (e) {
            console.error(e);
            return res.status(500).send();
          }

        });
      }

    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
    // Envaindo al whtsaap
    console.log("Enviando al whatsapp");
    let phoneNumerId = utilities.getPhoneIdRuc(result[tipo_comprobante].infoTributaria[0].ruc);
    if (phoneNumerId) {
      try {
        await WhatsAppGenesis.generateToken(phoneNumerId);
      } catch (e) {
        console.log(e)
      }
    }
    pdfBuffer = await fsPromises.readFile(__dirname + "../../../" + ruta);

    if (telefono && WhatsAppGenesis.token) {
      await WhatsAppGenesis.send({
        phone: telefono.startsWith("593")
          ? telefono
          : "593" + telefono.slice(1),
        file: pdfBuffer.toString("base64"),
      });
      console.log("Enviado al whatsapp");
    }

    await querySybase(db, "UPDATE ce_comprobante SET email = 1 WHERE ce_id = " +
      req.params.ce_id)

    db.disconnect();
    return res.status(200).send();
  });
};

module.exports = ctrl;