const moment = require('moment')
const express = require('express');
const Sybase = require('sybase');
const path = require('path');
const fs = require('fs');
const axios = require('axios')
const parseString = require('xml2js').parseString;
const params = require('../libs/params');
const utilities = require('../libs/utilities');
var base64 = require('file-base64');



var ctrl = {};

ctrl.ride = (req, res) =>{
  const connection = utilities.dbConnection(req.params.db);
  var query = "SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador  FROM ce_comprobante WHERE clave_acceso = '"+req.params.clave_acceso+"'"
  let db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect( (err) => {
    db.query(query, function (err, data) {

      if (data.length == 0){
        console.log('No se encontró ningún registro en ce_comprobante con clave de acceso: ',req.params.clave_acceso)
        return res.status(500).send();
      }
      parseString(data[0].ce_xml, async (err, result) => {
        try{
          var tipo_comprobante = Object.keys(result)[0];
          var tipo = '';
          switch(tipo_comprobante){
            case 'factura': tipo = 'factura'; break;
            case 'comprobanteRetencion': tipo = 'retencion'; break;
            case 'notaCredito': tipo = 'credito'; break;
            case 'notaDebito': tipo = 'debito'; break;
            case 'guiaRemision': tipo = 'remision'; break;
            case 'liquidacionCompra': tipo = 'liquidacion'; break;
          }
          let pdf = await axios.post('http://localhost:'+params.port+'/api/documento/ride/'+tipo+'/'+data[0].fecha_autorizacion, {xml:data[0].ce_xml});      
   		 return res.send();
        }catch(e) {
          console.log(e)
          return res.status(500).send();
        }
      });      
    db.disconnect();
    });
  });  
}

ctrl.ride_blob = (req, res) =>{
  const connection = utilities.dbConnection(req.params.db);
  var query = "SELECT ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador  FROM ce_comprobante WHERE clave_acceso = '"+req.params.clave_acceso+"'"
  let db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect( (err) => {
    db.query(query, function (err, data) {
      parseString(data[0].ce_xml, async (err, result) => {
        try{
          var tipo_comprobante = Object.keys(result)[0];
          var tipo = '';
          switch(tipo_comprobante){
            case 'factura': tipo = 'factura'; break;
            case 'comprobanteRetencion': tipo = 'retencion'; break;
            case 'notaCredito': tipo = 'credito'; break;
            case 'notaDebito': tipo = 'debito'; break;
            case 'guiaRemision': tipo = 'remision'; break;
            case 'liquidacionCompra': tipo = 'liquidacion'; break;
          }     
          await axios.post('http://localhost:'+params.port+'/api/documento/ride/'+tipo+'/'+data[0].fecha_autorizacion, {xml:data[0].ce_xml});      
	base64.encode(req.params.clave_acceso+'.pdf', function(err, base64String) {
	return res.send(base64String);
	});




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