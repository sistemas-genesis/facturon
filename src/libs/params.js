module.exports = {
  databases: [
    {
      user: 'dba',
      pass: 'proyecto2022',
      port: '49153',
      db: 'lino_test',
      host: 'localhost',
      ruc: '1307231686001',
      img: 'logo_ce.jpg',
      imgWidth: '50%',
      imgHeight: 'auto',
      nombreComercial: 'LINO',
      mail: {
        host: 'mail.ingjavierzambrano.com',
        port: 25,
        tls: { rejectUnauthorized: false },
        auth: {
          user: 'facturacion@ingjavierzambrano.com',
          pass: 'Empres@2022@'
        }
      },
      mailsDefault: {
        manual: false,
        mail: 'javier_zambrano62@yahoo.com'
      },
      mailNick: 'facturacion@ingjavierzambrano.com',
      estacion: '',
      punto: '',
      firma: {
        path: '',
        pass: '',
        add: 730,
        avisar_desde_dia: 0
      },
      leyenda_catastro: {
        status: true,
        key: '.',
        size: 10,
        breakLine: '/'
      },
      subsidio: {
        status: false,
        label: {
          subsidio: 'Subsidio',
          precio_sin_subsidio: 'P. Sin Subsidio',
          valor_total_sin_subsidio: 'Valor Total Sin Subsidio',
          ahorro_subsidio: 'Ahorro por Subsidio'
        }
      }

    },

  ],
  port: 8082,
  soap: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  genesisIp: 'http://181.198.196.143:2001/',
  tables: {
    file: 'archivo_txt',
    cabecera: 'in_cabecera_xml_temp',
    movimiento: 'in_movimiento_xml_temp'
  },
  sri: {
    codDocSustento: {
      '01': 'FACTURA',
      '02': 'NOTA DE VENTA',
      '03': 'LIQUIDACIÓN COMPRA',
      '04': 'NOTA DE CRÉDITO',
      '05': 'NOTA DE DÉBITO',
      '06': 'GUÍA DE REMISIÓN',
      '07': 'COMPROBANTE DE RETENCIÓN'
    },
    codImpuestoRetencion: {
      '1': 'RENTA',
      '2': 'IVA',
      '6': 'ISD'
    },
    formaPago: {
      '01': 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
      '15': 'COMPENSACIÓN DE DEUDAS',
      '16': 'TARJETA DE DÉBIT O',
      '17': 'DINERO ELECTRÓNICO',
      '18': 'TARJETA PREPAGO',
      '19': 'TARJETA CRÉDITO',
      '20': 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO',
      '21': 'ENDOSO DE TÍTULOS'
    },
    tarifaIVA: {
      '0': '0%',
      '2': '12%',
      '3': '14%',
      '4': '15%',
      '5': '5%',
      '6': 'No Objeto de Impuesto',
      '7': 'Excento de IVA',
      '8': 'IVA diferenciado',
      '10': '13%'
    },
    impuesto: {
      '2': 'IVA',
      '3': 'ICE',
      '5': 'IRBPNR'
    },
    codigoIVA: [
      {
        porcentaje: 0,
        codigo: 0,
      },
      {
        porcentaje: 12,
        codigo: 2,
      },
      {
        porcentaje: 14,
        codigo: 3,
      },
      {
        porcentaje: 15,
        codigo: 4,
      },
      {
        porcentaje: 5,
        codigo: 5,
      },
      {
        porcentaje: 8,
        codigo: 8,
      },
      {
        porcentaje: 13,
        codigo: 10,
      },
    ],
  },
  getItem: (json, clave, valor, item) => {
    var status = 0;
    for (var i = 0; i < json.length; i++) {
      if (json[i][clave] == valor)
        return json[i][item];
      else status++;
    }
    if (status == json.length) return -1;
  },
  optionsRIDE: {
    format: 'A4',
    orientation: 'portrait',
    header: {
      height: '1.5cm',
      contents: {
        default: '<div style="background-image: -webkit-linear-gradient(150deg, #0d47a1    85%, #212121  15%); color: white; padding: 0.2em; font-size: 1.2em; font-weight: bold; text-align: center; margin-left: 1em; margin-right: 1em">REPRESENTACIÓN IMPRESA DOCUMENTO ELECTRÓNICO (RIDE)</div>'
      }
    },
    footer: {
      height: "1.6cm",
      contents: {
        default: '<div style="background-image: -webkit-linear-gradient(150deg, #0d47a1    85%, #212121  15%); color: white; padding: 0.2em; font-size: 1.2em; text-align: center; margin-left: 1em; margin-right: 1em">REPRESENTACIÓN IMPRESA DOCUMENTO ELECTRÓNICO (RIDE)</div>'
      }
    }
  },
  facturonURL: '',
  mailTemplate: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <style> * { border: 0; margin: 0; padding: 0; } </style></head><body style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; height: 100%; hyphens: auto; line-height: 1.4; margin: 0; -moz-hyphens: auto; -ms-word-break: break-all; width: 100% !important; -webkit-hyphens: auto; -webkit-text-size-adjust: none; word-break: break-word;"> <style> @media only screen and (max-width: 600px) { .inner-body { width: 100% !important; } .footer { width: 100% !important; } } @media only screen and (max-width: 500px) { .button { width: 100% !important; } } @font-face { font-family: "Open Sans Regular"; src: url("https://fonts.googleapis.com/css?family=Open+Sans:400,700"); font-display: swap; } </style> <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; margin: 0; padding: 0; width: 100%; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;"> <tr> <td align="center" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box;"> <table class="content" width="100%" cellpadding="0" cellspacing="0" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; margin: 0; padding: 0; width: 100%; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;"> <!-- Email Body --> <tr> <td class="body" width="100%" cellpadding="0" cellspacing="0" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; margin: 0; padding: 0; width: 100%; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;"> <img src="https://user-images.githubusercontent.com/44660292/64268081-14a64700-cefd-11e9-8438-938b825aa5c3.jpg" style="width: 100%;" alt="" /> <table class="inner-body" align="center" cellpadding="0" cellspacing="0" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; background:url('https://user-images.githubusercontent.com/44660292/64271034-3950ed80-cf02-11e9-9a23-ed03d30c5f66.jpg') no-repeat;background-size: cover; margin: 0 auto; padding: 0; width: 100%; height: 385px; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px;"> <tr> <td colspan="2" style="text-align: center;color: #ffffff;font-weight: bold;font-size: 16px;font-family: Avenir, Helvetica, sans-serif;"> <p style="box-sizing: border-box; "> En este correo encontrar&aacute;s adjunto tu comprobante electr&oacute;nico, en el archivo XML y PDF; tambi&eacute;n podr&aacute;s encontrarlo en nuestro sitio web: <a href="http://sistemasgenesis.com.ec" style="text-decoration: none;color: orange;">%facturonURL%</a> </p> </td> </tr> <tr> <td colspan="2" class="content-cell" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box;width: 30%;padding-top: 3px;background-color: #38C1CF; text-align: center; font-weight: bold; font-size:19px"> %tipo_comprobante% </td> </tr> <tr> <td class="content-cell" style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box;width: 30%;padding-top: 3px;"> <div style="background-color: #38C1CF; height: 30px;border-top-right-radius: 20px;border-bottom-right-radius: 20px;"> <h1 style="font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box; color: #ffffff; font-size: 19px; font-weight: bold; margin-top: 0; text-align: center;">CLIENTE:</h1> </div> </td> <td class="content-cell"> <div style="background-color: transparent; width: 100%;color: black;height: 30px;padding-top:3px; text-align: center;font-family: Avenir, Helvetica, sans-serif;color: #ffffff;font-weight: bold; box-sizing: border-box;font-size: 16px;">%cliente%</div> </td> </tr> <tr> <td> <div style="background-color: #38C1CF;width: 80%;color: black;height: 30px;padding-top:3px; text-align: center;font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box;font-size: 1.2em;border-top-right-radius: 20px;font-weight: bold; border-bottom-right-radius: 20px;color: #ffffff; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;">FECHA:</div> </td> <td> <div style="background-color: transparent;width: 100%;color: black;height: 30px;padding-top:3px; text-align: center;font-family: Avenir, Helvetica, sans-serif;color: #ffffff;font-weight: bold; box-sizing: border-box;font-size: 1.2em; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;">%fecha%</div> </td> </tr> <tr> <td> <div style="background-color: #38C1CF;width: 80%;color: black;height: 30px;padding-top:3px; text-align: center;font-family: Avenir, Helvetica, sans-serif; box-sizing: border-box;font-size: 1.2em;border-top-right-radius: 20px;font-weight: bold; border-bottom-right-radius: 20px;color: #ffffff; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;">VALOR:</div> </td> <td> <div style="background-color: transparent;width: 100%;color: black;height: 30px;padding-top:3px; text-align: center;font-family: Avenir, Helvetica, sans-serif;color: #ffffff;font-weight: bold; box-sizing: border-box;font-size: 1.2em; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%;">$ %valor%</div> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table></body></html>`,
  mailTask: {
    frequency: '*/3 * * * *',
    lastComprobantesDays: 3,
    top: 10,
    status: false,
  },
  RIDE: {
    name: {
      codigoPrincipal: 'COD.',
      codigoAuxiliar: 'COD. AUXILIAR',
      cantidad: 'CANT.',
      descripcion: 'DESCRIPCIÓN',
      precioUnitario: 'PRECIO',
      descuento: 'DESC.',
      precioTotal: 'SUBTOTAL'
    },
    optionalItems: {
      detAdicional: {
        status: true,
        mode: 2, // 0: Columnas en movimiento, 1: Va como observacion al final, -1: Incierto, 2: Como un producto mas, para las constructoras
        names: ['DET ADIC. 1', 'DET ADIC. 2']
      },
      codigoAuxiliar: false,
      propina: {
        status: false,
        name: 'SERVICIO'
      }

    }
  }
};