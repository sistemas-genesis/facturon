const moment = require('moment')
const express = require('express');
const Sybase = require('sybase');
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');
const axios = require('axios')
const nodemailer = require('nodemailer');
const parseString = require('xml2js').parseString;
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const params = require('../libs/params');
const utilities = require('../libs/utilities');

var ctrl = {};

ctrl.mail = (req, res) =>{
  const connection = utilities.dbConnection(req.params.db);
  var query = "SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador  FROM ce_comprobante WHERE ce_id = "+req.params.ce_id;
  let db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect( (err) => {
    db.query(query, function (err, data) {
      parseString(data[0].ce_xml, async (err, result) => {
        try{
          var tipo_comprobante = Object.keys(result)[0];
          var tipo = '';
          switch(tipo_comprobante){
            case 'factura': tipo = 'factura'; break;
            case 'liquidacionCompra': tipo = 'liquidacion'; break;
            case 'notaCredito': tipo = 'credito'; break;
            case 'notaDebito': tipo = 'debito'; break;
            case 'guiaRemision': tipo = 'remision'; break;
            case 'comprobanteRetencion': 
              
              if ( parseFloat(result[tipo_comprobante]['$'].version) >= 2)
                tipo = 'retencion2';
              else 
                tipo = 'retencion'
            break;
          }
    		  let mail = utilities.getMailByRuc(result[tipo_comprobante].infoTributaria[0].ruc);
          let pdf = await axios.post('http://localhost:'+params.port+'/api/documento/ride/'+tipo+'/'+data[0].fecha_autorizacion, {xml:data[0].ce_xml});

          //Verificacion de método OAuth2
    		  if (mail.auth.type=='OAuth2'){
    			const OAuth2Client = new google.auth.OAuth2(mail.auth.clientId, mail.auth.clientSecret,'https://developers.google.com/oauthplayground');
    			OAuth2Client.setCredentials({
    				refresh_token:mail.auth.refreshToken,
    				tls:{
    					rejectUnauthorized:false
    				}
    			})
    			mail.auth.accessToken = await OAuth2Client.getAccessToken();
    		  }
    		  //Fin
          var transporter = nodemailer.createTransport(mail);
          var to = req.params.mails.split(',');
          var secuencial = result[tipo_comprobante].infoTributaria[0].estab+'-'+result[tipo_comprobante].infoTributaria[0].ptoEmi + '-'+result[tipo_comprobante].infoTributaria[0].secuencial;
          var html = params.mailTemplate;
          html = html.replace('%facturonURL%', params.facturonURL)
          html = html.replace('%cliente%', data[0].nombre_comprador)
          html = html.replace('%fecha%',moment(data[0].fecha_autorizacion, 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY'))
          html = html.replace('%valor%', utilities.getValorFromXml(result));
          html = html.replace('%tipo_comprobante%',tipo.toUpperCase());
          var mailOptions = {
            from: mail.auth.user,
            to,
            subject:'📝 '+tipo.toUpperCase()+' - '+data[0].nombre_comprador+', FACTURACIÓN ELECTRÓNICA '+secuencial,
            html,
            attachments: [{
              filename: secuencial+'.pdf',
              path: __dirname + '../../../'+pdf.data,
              contentType: 'application/pdf'
            },
            {
              filename: secuencial+'.xml',
              content: new Buffer(data[0].xml_autorizado,'utf-8')
            }],
          };
          setTimeout(() => {
            transporter.sendMail(mailOptions, function(error, info){
              try{
                if (error && error.responseCode != 501 && error.toString() != 'Error: No recipients defined')
                  console.log(error);
                else {
                  console.log(info ? info : 'Correo receptor mal ingresado');
                  utilities.executeSQL(connection, 'UPDATE ce_comprobante SET email = 1 WHERE ce_id = ' + req.params.ce_id);
                }
        return res.send();
              }catch(e){console.log(e)}
              return res.status(500).send();
            });
          }, 1000)
        }catch(e) {
          console.log(e)
          return res.status(500).send();
        }
      });      
    db.disconnect();
    });
  });  
}





module.exports = ctrl;