const express = require('express');
const params = require('../libs/params');

var ctrl = {};

ctrl.empresas = (req, res) => {
  var data = [];
  params.databases.forEach(i => {
    data.push({
      db: i.db,
      ruc: i.ruc,
      img: i.img,
      empresa: i.nombreComercial ? i.nombreComercial : i.razonSocial,
      estacion:i.estacion,
      punto:i.punto,
      avisar_desde_dia: i.firma.avisar_desde_dia,
      mailsDefault: i.mailsDefault,
      publicip:params.publicip
    })
  })  
  return res.send(data);
}

ctrl.publicip = (req, res) => {
  return res.json({ip:params.publicip});
}

ctrl.login = (req, res) => {
  if (req.params.key == 'proyecto2014')
    return res.json(params);
  else
    return res.send([])
}


module.exports = ctrl;