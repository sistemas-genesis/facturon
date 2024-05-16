const express = require('express');
const Sybase = require('sybase');
const lineReader = require('line-reader');
const params = require('../libs/params');
const fs = require('fs');
const schedule = require('node-schedule');
const axios = require('axios')
const nodemailer = require('nodemailer');
const parseString = require('xml2js').parseString;
const moment = require('moment')
const utilities = require('../libs/utilities')
const bwipjs = require('bwip-js');

var ctrl = {};

ctrl.getMailDefaultByRuc = (ruc) => {
	var index = false;
	for (var i = 0; i < params.databases.length; i++) {
		if (params.databases[i].ruc == ruc){
			return params.databases[i].mailsDefault.mail;
		}
	}
}
ctrl.task = () =>{
	  if (params.mailTask.status)
	  var task = schedule.scheduleJob(params.mailTask.frequency, async () => {
	    var databases = ctrl.getDatabasesDistinct();
	    databases.forEach(i => {

	      var query = "SELECT TOP "+params.mailTask.top+" ce_id, ce_xml,fecha_autorizacion, numero_autorizacion, xml_autorizado, web_clear_special(nombre_comprador) nombre_comprador, ruc_emisor  FROM ce_comprobante WHERE estado = 4 AND email = 0 and fecha_autorizacion > today()-"+params.mailTask.lastComprobantesDays;
	      
	      let db = new Sybase(i.host, i.port, i.db, i.user, i.pass); 
	      db.connect( err => {
	        if(err) console.log(err);
	        db.query(query, (err, data) => {
	          if(err) console.log(err);
	          data.forEach(j => {
	            parseString(j.ce_xml, async (err, result) => {
	              var tipo_comprobante = Object.keys(result)[0];
	              var to = ctrl.getMailFromXml(result[tipo_comprobante]);
	              if(to){
	              	to = to.concat(','+ctrl.getMailDefaultByRuc(j.ruc_emisor))
	              	try {
	              		await axios.get('http://localhost:'+params.port+'/api/mail/'+i.db+'/'+j.ce_id+'/'+to)
					}catch(e){
						console.log(e);
						ctrl.executeSQL(i, 'UPDATE ce_comprobante SET email = 1 WHERE ce_id = ' + j.ce_id);
					}
	              }
	              else
	              	ctrl.executeSQL(i, 'UPDATE ce_comprobante SET email = 1 WHERE ce_id = ' + j.ce_id);
	            });
	          })
	           
	          db.disconnect();
	        });
	      });
	    })
	  });

}

ctrl.getDatabasesDistinct = () => {
	var databases=[];
	params.databases.forEach(i => {
      var isThere = false;
      for(var j=0; j< databases.length; j++){
        if (i.db == databases[j].db && i.host == databases[j].host){
          isThere = true;
          break;
        }
      }
      if (!isThere) databases.push(i);
    })
    return databases;
}
ctrl.dbConnection = db => {
	for (var i = 0; i < params.databases.length; i++) {
		if (params.databases[i].db == db)
			return params.databases[i];
	}
}

ctrl.getValorFromXml = (json) => {
	var res = 0;
	switch(Object.keys(json)[0]){
		case 'factura': 
			res = json.factura.infoFactura[0].importeTotal[0]; 
			break;
		case 'comprobanteRetencion':
			if ( parseFloat(json.comprobanteRetencion['$'].version) >= 2)
				json.comprobanteRetencion.docsSustento[0].docSustento[0].retenciones[0].retencion.forEach(i=>{
	        		res+=parseFloat(i.valorRetenido[0])
	      		})
			else
	      		json.comprobanteRetencion.impuestos[0].impuesto.forEach(i=>{
	        		res+=parseFloat(i.valorRetenido[0])
	      		})
      		res = res.toFixed(2); 
      		break;
		case 'notaCredito': 
			res = json.notaCredito.infoNotaCredito[0].totalSinImpuestos[0];
			break;
		case 'notaDebito': 
			res = json.notaDebito.infoNotaDebito.totalSinImpuestos[0];
			break;
		case 'liquidacionCompra': 
			res = json.liquidacionCompra.infoLiquidacionCompra[0].importeTotal[0]
			break;
		case 'guiaRemision': 
			res = '';
			break;
	}
	return res;	
}

ctrl.getMailFromXml = json => {
	if(json.infoAdicional){
		for (var i=0; i<json.infoAdicional[0].campoAdicional.length; i++){
			if (json.infoAdicional[0].campoAdicional[i]["$"].nombre == 'Email')
				return json.infoAdicional[0].campoAdicional[i]["_"]
		}
	}
	return false
}

ctrl.getMailByRuc = (ruc, estacion, punto) => {
	var index = false;
	for (var i = 0; i < params.databases.length; i++) {
		if (params.databases[i].ruc == ruc){
			index = i;
			if(params.databases[i].estacion == '' || params.databases[i].estacion == estacion){
				index = i;
				if(params.databases[i].punto == '' || params.databases[i].punto == punto)
					return params.databases[i].mail;
			}
		}
	}
	if (index) return params.databases[index].mail;
}
ctrl.getFileFromDb = (dbjson, sesion) => {
	var filename = Math.random()+'.gns';
	var query = "SELECT archivo FROM "+params.tables.file+" WHERE sesion = "+sesion;
	let db = new Sybase(dbjson.host, dbjson.port, dbjson.db, dbjson.user, dbjson.pass); 
	db.connect( (err) => {
	  	if (err) {
	  		console.log(err);
	  		return ;
	  	}
		db.query(query, function (err, res) {
	  		if (err){
	  			console.log(err);
	  			return;
	  		}
	  		console.log(res);
	  		db.disconnect();
  			fs.writeFileSync(filename, res[0].archivo);
		});
	});
	return new Promise(resolve => {
		setTimeout(() => {
		  resolve(filename);
		}, 500);
	}); 
}

ctrl.getClavesAcceso = filename => {
	var claves = []
	try{
		lineReader.eachLine(filename, function(line) {
		var aux = line.split('\t');
  		if (aux[aux.length -1].length == 49 || aux[aux.length -1].length == 37)
  			if(aux[aux.length -2].substr(8,2) == '01')
  				claves.push({clave_acceso: aux[aux.length -2], autorizacion: aux[aux.length -1]})
		}).then(function (err) {
	  		if (err) throw err;
		});
	}catch(e) {
		return new Promise(resolve => {
			setTimeout(() => {
				fs.unlinkSync(filename)
			  	resolve(claves);
			}, 500);
		}); 
	}
}

ctrl.getDataFromSoap = soap => {
	//console.log(soap['soap:Envelope']['soap:Body'][0]['ns2:autorizacionComprobanteResponse'][0].RespuestaAutorizacionComprobante[0].autorizaciones[0].autorizacion[0].comprobante[0]);
	return soap['soap:Envelope']['soap:Body'][0]['ns2:autorizacionComprobanteResponse'][0].RespuestaAutorizacionComprobante[0].autorizaciones[0].autorizacion[0].comprobante[0];
}

ctrl.executeSQL = (dbjson, query) => {
	let db = new Sybase(dbjson.host, dbjson.port, dbjson.db, dbjson.user, dbjson.pass); 
	db.connect( (err) => {
	  	if (err) return console.log(err);
		db.query(query, function (err, res) {
	  		if (err) console.log(err);
	  		db.disconnect();
  			return true
		});
	});
}

ctrl.getLogoByRuc = (ruc, estacion, punto) => {
	var index = false;
	for (var i = 0; i < params.databases.length; i++) {
		if (params.databases[i].ruc == ruc){
			index = i;
			if(params.databases[i].estacion == '' || params.databases[i].estacion == estacion){
				index = i;
				if(params.databases[i].punto == '' || params.databases[i].punto == punto)
					return params.databases[i].img;
			}
		}
	}
	if (index) return params.databases[index].img;
}

ctrl.lastOrNoDetAdicional = json => {
	var last = false;
	var count = 0;
	json.forEach((i, index)=>{
		if(i.detallesAdicionales){
			count++
			if (index == json.length-1)
				last = true
		}
	})
	return last && count == 1 ? true : false
}

ctrl.getColspan = () =>{
	var colspan = 0;
	colspan+=params.RIDE.optionalItems.detAdicional.status && params.RIDE.optionalItems.detAdicional.mode == 0 ? params.RIDE.optionalItems.detAdicional.names.length : 0;
    colspan+=params.RIDE.optionalItems.codigoAuxiliar ? 1 : 0;
    return colspan;
}

ctrl.getRowspan = () =>{
	var rowspan = 0;
	rowspan+=params.RIDE.optionalItems.propina.status ? 1 : 0;
    return rowspan;
}

ctrl.getBarcode = async clave_acceso => {

	return new Promise((resolve, reject) => {
        bwipjs.toBuffer({
            bcid: 'code128',
            text: clave_acceso,
            scale: 3,
            height: 10,
            //includetext: true,
            textxalign: 'center'
        }, function(error, buffer) {
            if(error) {
                reject(error)
            } else {
                let gifBase64 = `data:image/gif;base64,${buffer.toString('base64')}`
                resolve(gifBase64)
            }
        })
    })
}

ctrl.numberWithCommas = n =>n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

ctrl.isset = (obj, key) => {
    if (typeof key === 'undefined')
        return (typeof obj !== 'undefined' && obj != '' && obj && obj !== null && obj !== 'null') || false
    else
        return (typeof obj !== 'undefined' && obj != '' && obj && obj !== null && typeof obj[key] !== 'undefined' && obj[key] != '' && obj[key] !== null) || false
}

ctrl.asyncParseString = async xml =>{
    return new Promise((resolve, reject) => {
        parseString(xml, function (err, json) {
            if (err)
                reject(err);
            else
                resolve(json);
        });

    });
}

ctrl.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

ctrl.llena_cero = (valor, limite) => {
	valor = valor.toString();
    while (valor.length < limite) valor = '0'.concat(valor);                
    return valor;
}

ctrl.parseMonth = month => {
	switch(month){
		case 'Jan' : return 1;
		case 'Feb' : return 2;
		case 'Mar' : return 3;
		case 'Apr' : return 4;
		case 'May' : return 5;
		case 'Jun' : return 6;
		case 'Jul' : return 7;
		case 'Aug' : return 8;
		case 'Sep' : return 9;
		case 'Oct' : return 10;
		case 'Nov' : return 11;
		case 'Dec' : return 12;
	}
}

ctrl.getIndex = function (json, clave, valor){
    var status = 0;
    for (var i = 0; i < json.length; i++) {
        if (json[i][clave] == valor)
            return i;
        else status ++;
    }
    if (status == json.length) return -1;
}

ctrl.getSubIndex = function (json, clave, subclave, valor){
    var status = 0;
    for (var i = 0; i < json.length; i++) {
        if (json[i][clave][subclave] == valor)
            return i;
        else status ++;
    }
    if (status == json.length) return -1;
}

ctrl.getLeyendaCatastro = (comprobante) => {
	var index = ctrl.getIndex(params.databases, 'ruc', comprobante.infoTributaria[0].ruc[0]);
	var leyenda_catastro = {
		size: 0,
		text: ''
	}
	if (typeof params.databases[index].leyenda_catastro !== 'undefined' && params.databases[index].leyenda_catastro.status){
		if (typeof comprobante.infoAdicional !== 'undefined'){
			var index_adicional = ctrl.getSubIndex(comprobante.infoAdicional[0].campoAdicional, '$', 'nombre', params.databases[index].leyenda_catastro.key)
			if (index_adicional >= 0)
				leyenda_catastro = {
					size: params.databases[index].leyenda_catastro.size,
					text: comprobante.infoAdicional[0].campoAdicional[index_adicional]["_"].replace(params.databases[index].leyenda_catastro.breakLine, '<br>')
				}
			

		}
	}
	if (typeof comprobante.infoTributaria[0].agenteRetencion !== 'undefined'){
		leyenda_catastro = {
			size: params.databases[index].leyenda_catastro.size,
			text: leyenda_catastro.text + 'AGENTE DE RETENCION SEGUN RESOLUCION NO NAC-DNCRASC20-00000001'
			//text: comprobante.infoTributaria[0].agenteRetencion
		}
	}

	if (typeof comprobante.infoTributaria[0].contribuyenteRimpe !== 'undefined'){
	
		if (leyenda_catastro.text != '')
			leyenda_catastro.text += ' <br> ' + 'CONTRIBUYENTE REGIMEN RIMPE'
		else
			leyenda_catastro = {
				size: params.databases[index].leyenda_catastro.size,
				text: 'CONTRIBUYENTE REGIMEN RIMPE'//comprobante.infoTributaria[0].contribuyenteRimpe[0]+'.'
			}
	}

	if (typeof comprobante.infoTributaria[0].regimenMicroempresas !== 'undefined'){
		leyenda_catastro = {
			size: params.databases[index].leyenda_catastro.size,
			text: comprobante.infoTributaria[0].regimenMicroempresas[0]+'.'
		}
	}

	

	return leyenda_catastro;
		
}

ctrl.getDatabaseInfoByRuc = (ruc, estacion, punto) => {
	var index = false;
	for (var i = 0; i < params.databases.length; i++) {
		if (params.databases[i].ruc == ruc){
			index = i;
			if(params.databases[i].estacion == '' || params.databases[i].estacion == estacion){
				index = i;
				if(params.databases[i].punto == '' || params.databases[i].punto == punto)
					return params.databases[i];
			}
		}
	}
	if (index) return params.databases[index];
}
module.exports = ctrl;
