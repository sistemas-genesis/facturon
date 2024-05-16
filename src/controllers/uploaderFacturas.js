const express = require('express');
const parseString = require('xml2js').parseString;
const soap = require('soap');
const params = require('../libs/params');
const utilities = require('../libs/utilities');
const moment = require('moment')
const fs = require('fs');

var ctrl = {};

ctrl.getFacturaCompra = async(req, res) => {
  console.log(req.params);
  const connection = utilities.dbConnection(req.params.db);
  const pathFile = await utilities.getFileFromDb(connection, req.params.sesion);
  const xmls = await utilities.getClavesAcceso(pathFile);
  utilities.executeSQL(connection, 'UPDATE '  +params.tables.file +' SET length = ' +xmls.length+ ' WHERE sesion = '+req.params.sesion+';commit;');
  var query = "";
  
  xmls.forEach(i => {
    soap.createClientAsync(params.soap).then((client) => {
        return client.autorizacionComprobanteAsync({claveAccesoComprobante: i.clave_acceso});
    }).then((result) => {
      parseString(result[1], (err, result) => {
        if (!err){
          parseString(utilities.getDataFromSoap(result), (err, r) => {
          query = "";
          if (!err){
            var it = r.factura.infoTributaria[0], inf = r.factura.infoFactura[0], d = r.factura.detalles[0].detalle;
              var nombreComercial = it.nombreComercial ? "'"+it.nombreComercial[0]+"'" : 'NULL';   
              nombreComercial = nombreComercial.normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var razonSocial = it.razonSocial[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var dirMatriz = it.dirMatriz[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              query += "INSERT INTO "+params.tables.cabecera+ 
              "(sesion, clave_acceso, fecha_autoriza, razon_social, nombre_comercial, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion) VALUES"+
              "("+req.params.sesion+", '"+i.clave_acceso+"', '"+moment(inf.fechaEmision[0], 'DD/MM/YYYY').format('YYYY-MM-DD')+"', '"+razonSocial+"', "+nombreComercial+", '"+dirMatriz+"', '"+it.ruc[0]+"', '"+it.estab[0]+"', '"+it.ptoEmi[0]+"', '"+it.secuencial[0]+"', '"+i.autorizacion+"');";

              d.forEach((j) => {
                var impuesto = 0;
                j.impuestos[0].impuesto.forEach(k => {
                  impuesto += parseFloat(k.valor[0]);
                })

                var codigoAuxiliar = j.codigoAuxiliar ? "'"+j.codigoAuxiliar[0]+"'" : 'NULL';
                var descripcion = j.descripcion[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
                var codigoPrincipal = utilities.isset(j.codigoPrincipal) ? j.codigoPrincipal[0] : ''

                query += "INSERT INTO "+params.tables.movimiento+
                " (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto) VALUES "+
                "("+req.params.sesion+", '"+i.clave_acceso+"', '"+j.codigoPrincipal[0]+"', "+codigoAuxiliar+", "+j.cantidad[0]+", "+j.precioUnitario[0]+", "+j.descuento[0]+", "+j.precioTotalSinImpuesto[0]+", '"+descripcion+"',  "+impuesto+");";
              })
            }
          })
        }
        
      })
      utilities.executeSQL(connection, query);
    });
  })
  
  
  return res.send();
}

ctrl.getFacturaCompraIndividual = async(req, res) => {
  const connection = utilities.dbConnection(req.params.db);
  var query = "";
    soap.createClientAsync(params.soap).then((client) => {
        return client.autorizacionComprobanteAsync({claveAccesoComprobante: req.params.clave_acceso});
    }).then((result) => {      
      parseString(result[1], (err, result) => {
        if (!err){
          parseString(utilities.getDataFromSoap(result), (err, r) => {
          query = "";
          if (!err){
            var it = r.factura.infoTributaria[0], inf = r.factura.infoFactura[0], d = r.factura.detalles[0].detalle;
              var nombreComercial = it.nombreComercial ? "'"+it.nombreComercial[0]+"'" : 'NULL';   
              nombreComercial = nombreComercial.normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var razonSocial = it.razonSocial[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var dirMatriz = it.dirMatriz[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var clave_acceso = it.claveAcceso[0];

              //Descuento adicional en el nodo Total con Impuestos
              var descuentoAdicional = 0;
              if (typeof inf.totalConImpuestos !== 'undefined')
                inf.totalConImpuestos[0].totalImpuesto.forEach(k=>{
                  descuentoAdicional += typeof k.descuentoAdicional === 'undefined' ? 0 : parseFloat(k.descuentoAdicional);
                })
              //Fin
              
              d.forEach((j) => {
                var impuesto = 0;
                j.impuestos[0].impuesto.forEach(k => {
                  impuesto += parseFloat(k.valor[0]);
                  descuentoAdicional += typeof k.descuentoAdicional === 'undefined' ? 0 : k.descuentoAdicional;
                })

                //Detalles Adicionales por producto
                var detadicional = '';
                if (typeof j.detallesAdicionales !== 'undefined')
                  j.detallesAdicionales[0].detAdicional.forEach(k=>{
                    detadicional += k["$"].nombre + " = " + k["$"].valor
                  })
                detadicional = detadicional.replace(/["']/g, '"');
                //Fin
        
                var codigoAuxiliar = j.codigoAuxiliar ? "'"+j.codigoAuxiliar[0]+"'" : 'NULL';
                var descripcion = j.descripcion[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
                var codigoPrincipal = utilities.isset(j.codigoPrincipal) ? j.codigoPrincipal[0] : ''
                descripcion = descripcion.replace(/["']/g, "");

                query += "INSERT INTO "+params.tables.movimiento+
                " (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto, detadicional) VALUES "+
                "("+req.params.sesion+", '"+clave_acceso+"', '"+codigoPrincipal+"', "+codigoAuxiliar+", "+j.cantidad[0]+", "+j.precioUnitario[0]+", "+j.descuento[0]+", "+j.precioTotalSinImpuesto[0]+", '"+descripcion+"',  "+impuesto+", '"+detadicional+"');";
              })

              query= "INSERT INTO "+params.tables.cabecera+ 
              "(sesion, clave_acceso, fecha_autoriza, razon_social, nombre_comercial, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion, descuento_adicional) VALUES"+
              "("+req.params.sesion+", '"+clave_acceso+"', '"+moment(inf.fechaEmision[0], 'DD/MM/YYYY').format('YYYY-MM-DD')+"', '"+razonSocial+"', "+nombreComercial+", '"+dirMatriz+"', '"+it.ruc[0]+"', '"+it.estab[0]+"', '"+it.ptoEmi[0]+"', '"+it.secuencial[0]+"', '"+req.params.clave_acceso+"', "+descuentoAdicional+");" + query;
        
            }
          })
        }
        
      }) 
   utilities.executeSQL(connection, query);    
  });
  
  
  return res.send();
}

ctrl.getFacturaVentaIndividual = async(req, res) => {
  const connection = utilities.dbConnection(req.params.db);
  var query = "";
    soap.createClientAsync(params.soap).then((client) => {
        return client.autorizacionComprobanteAsync({claveAccesoComprobante: req.params.clave_acceso});
    }).then((result) => {
      //console.log(result);return;
      parseString(result[1], (err, result) => {
        if (!err){
          parseString(utilities.getDataFromSoap(result), (err, r) => {
          query = "";
          if (!err){
            var it = r.factura.infoTributaria[0], inf = r.factura.infoFactura[0], d = r.factura.detalles[0].detalle;
              var direccionComprador = inf.direccionComprador ? "'"+inf.direccionComprador[0]+"'" : 'NULL';   
              direccionComprador = direccionComprador.normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var razonSocialComprador = inf.razonSocialComprador[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
              var clave_acceso = it.claveAcceso[0];
        
              query += "INSERT INTO "+params.tables.cabecera+ 
              "(sesion, clave_acceso, fecha_autoriza, razon_social, direccion_prov, ruc_prov, estacion, punto, secuencial, autorizacion) VALUES"+
              "("+req.params.sesion+", '"+clave_acceso+"', '"+moment(inf.fechaEmision[0], 'DD/MM/YYYY').format('YYYY-MM-DD')+"', '"+razonSocialComprador+"', "+direccionComprador+", '"+inf.identificacionComprador[0]+"', '"+it.estab[0]+"', '"+it.ptoEmi[0]+"', '"+it.secuencial[0]+"', '"+req.params.clave_acceso+"');";
              d.forEach((j) => {
                var impuesto = 0;
                j.impuestos[0].impuesto.forEach(k => {
                  impuesto += parseFloat(k.valor[0]);
                })
        
                var codigoAuxiliar = j.codigoAuxiliar ? "'"+j.codigoAuxiliar[0]+"'" : 'NULL';
                var descripcion = j.descripcion[0].normalize('NFD').replace(/[\u0300-\u036f]/g,"");
                var codigoPrincipal = utilities.isset(j.codigoPrincipal) ? j.codigoPrincipal[0] : ''
                descripcion = descripcion.replace(/["']/g, "");

                query += "INSERT INTO "+params.tables.movimiento+
                " (sesion, clave_acceso, codigoPrincipal, codigoAuxiliar, cantidad, precioUnitario, descuento, precioTotalSinImpuesto, descripcion, impuesto) VALUES "+
                "("+req.params.sesion+", '"+clave_acceso+"', '"+codigoPrincipal+"', "+codigoAuxiliar+", "+j.cantidad[0]+", "+j.precioUnitario[0]+", "+j.descuento[0]+", "+j.precioTotalSinImpuesto[0]+", '"+descripcion+"',  "+impuesto+");";
              })
        
            }
          })
        }
        
      }) 
   utilities.executeSQL(connection, query);    
  });
  
  
  return res.send();
}



module.exports = ctrl;