const fs = require('fs');
const utilities = require('../libs/utilities');
const params = require('../libs/params');
const pem = require('pem');
const openssl = require('async-openssl');
const moment = require('moment')

var ctrl = {};

ctrl.fecha_caducidad = async (req, res) => 
{
  	
  	const entity = params.databases[utilities.getIndex(params.databases, 'ruc', req.params.ruc)];
  	if (entity.firma.path == '')
  		return res.send()
	const pfx = fs.readFileSync(entity.firma.path);

	pem.readPkcs12  (pfx, {p12Password :entity.firma.pass},async  (err, cert) => {
		if (err)
			return res.status(500).send(err)
		
		try {
			var pem_path = Math.random() + '.pem';
			await fs.writeFileSync(pem_path, cert.cert);

		    var fecha = await openssl('x509 -enddate -noout -in ' + __dirname + '/../../' + pem_path);

		    fecha = fecha.split('notAfter=')[1]
		    fecha = fecha.split(' ')
		    if(fecha[1] == '') fecha.splice(1,1)
		    var year = fecha[3].toString();
		    var month = utilities.llena_cero(utilities.parseMonth(fecha[0]),2).toString()
		    var day = utilities.llena_cero(fecha[1],2).toString()
		    fecha = year+month+day
		    fecha = moment(fecha, '"YYYYMMDD')
		    var difference = fecha.diff(moment(), 'days') 
			difference += entity.firma.add;

		    fs.unlinkSync(pem_path)

		    return res.send(difference.toString())
		}
		catch(e){
			return res.status(500).send(e)
		}
		
	});


};

ctrl.info = async (req, res) => 
{
  	var pfx_path = Math.random() + '.pfx';
	await fs.writeFileSync(pfx_path, req.body.firma.split(',')[1],'base64');
	const pfx = fs.readFileSync(pfx_path);

	pem.readPkcs12  (pfx, {p12Password :req.body.pass},async  (err, cert) => {
		if (err){
			if (err.toString().indexOf('invalid password') != -1)
				return res.json({
					msg: 'La contraseña de la firma es incorrecta',
					success: false
				})
			else
				return res.json({
					msg: err.toString(),
					success: false
				})
		}
		try {
			var info = {}
			var pem_path = Math.random() + '.pem';
			await fs.writeFileSync(pem_path, cert.cert);

		    var fecha = await openssl('x509 -enddate -noout -in ' + __dirname + '/../../' + pem_path);
		    fecha = fecha.split('notAfter=')[1]
		    fecha = fecha.split(' ')
		    if(fecha[1] == '') fecha.splice(1,1)
		    var year = fecha[3].toString();
		    var month = utilities.llena_cero(utilities.parseMonth(fecha[0]),2).toString()
		    var day = utilities.llena_cero(fecha[1],2).toString()
		    fecha = year+'-'+month+'-'+day;
		    info.enddate = moment(fecha, 'YYYY-MM-DD')
		    info.diff =  info.enddate .diff(moment(), 'days') 
		    info.enddate = moment(info.enddate).format('YYYY-MM-DD')
		    var fecha = await openssl('x509 -startdate -noout -in ' + __dirname + '/../../' + pem_path);
		    fecha = fecha.split('notBefore=')[1]
		    fecha = fecha.split(' ')
		    if(fecha[1] == '') fecha.splice(1,1)
		    var year = fecha[3].toString();
		    var month = utilities.llena_cero(utilities.parseMonth(fecha[0]),2).toString()
		    var day = utilities.llena_cero(fecha[1],2).toString()
		    fecha = year+'-'+month+'-'+day;
		   	info.startdate = moment(fecha, 'YYYY-MM-DD').format('YYYY-MM-DD')

		    var subject = await openssl('x509 -subject -noout -in ' + __dirname + '/../../' + pem_path);
		    info.subject= subject

		    var rest = await openssl('x509 -text -noout -in ' + __dirname + '/../../' + pem_path+' -certopt no_subject,no_header,no_version,no_serial,no_signame,no_validity,no_issuer,no_pubkey,no_sigdump,no_aux');
		    info.rest = rest;

		    fs.unlinkSync(pem_path)
		    fs.unlinkSync(pfx_path)

		    return res.json({
		    	success: true,
		    	data: info
		    })
		}
		catch(e){
			return res.json({
				msg: e.error,
				success: false
			})
		}
		
	});


};

module.exports = ctrl;