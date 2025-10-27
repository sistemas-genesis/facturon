const express = require('express');
const router = express.Router();
const controladores = require('../controllers/');


module.exports = app => {

	//Documentos
	router.post('/api/documento/ride/factura/:fechaAutorizacion/', controladores.documento.rideFactura);	
	router.post('/api/documento/ride/retencion/:fechaAutorizacion', controladores.documento.rideRetencion);
	router.post('/api/documento/ride/credito/:fechaAutorizacion', controladores.documento.rideCredito);
	router.post('/api/documento/ride/debito/:fechaAutorizacion', controladores.documento.rideDebito);
	router.post('/api/documento/ride/remision/:fechaAutorizacion', controladores.documento.rideRemision);
	router.post('/api/documento/ride/liquidacion/:fechaAutorizacion', controladores.documento.rideLiquidacion);
	router.post('/api/documento/ride/retencion2/:fechaAutorizacion', controladores.documento.rideRetencion2);
	router.get('/api/getXmlById/:db/:id', controladores.documento.getXmlById);

	router.post('/api/documento/:cedula_ruc&:start&:end&:db', controladores.documento.get);
	router.post('/api/documentoLike/:start&:end&:db', controladores.documento.getLike);

	//mail
	router.get('/api/mail/:db/:ce_id/:mails', controladores.mail.mail);	
	//genesis
	router.get('/api/genesis/ride/:db/:clave_acceso/', controladores.genesis.ride);
	router.get('/api/genesis/ride_blob/:db/:clave_acceso/', controladores.genesis.ride_blob);
	//UploaderFacturas
	router.get('/api/getFacturaCompra/:db/:sesion', controladores.uploaderFacturas.getFacturaCompra);
	router.get('/api/getFacturaCompraIndividual/:db/:sesion/:clave_acceso', controladores.uploaderFacturas.getFacturaCompraIndividual);
	router.get('/api/getFacturaVentaIndividual/:db/:sesion/:clave_acceso', controladores.uploaderFacturas.getFacturaVentaIndividual);
	//Genesis Gasolinera API REST
	router.get('/api/persona/:db/:cedula', controladores.gasolinera.persona);

	//Params
	router.get('/api/params/empresas', controladores.params.empresas)
	router.get('/api/params/login/:key', controladores.params.login)
	router.get('/api/params/publicip', controladores.params.publicip)

	//PDF
	router.get('/api/pdf/:file', controladores.pdf.file);	

	//Firma
	router.get('/api/firma/fecha_caducidad/:ruc', controladores.firma.fecha_caducidad);
	router.post('/api/firma/info', controladores.firma.info);

	//Web
	router.get('/config', controladores.web.config);
	router.get('*', controladores.web.get);

  app.use(router);

};
