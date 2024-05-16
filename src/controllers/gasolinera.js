const express = require('express');
const params = require('../libs/params');
const utilities = require('../libs/utilities');
const axios = require('axios');

var ctrl = {};

ctrl.persona = async (req, res) => {
  const connection = utilities.dbConnection(req.params.db);
  const persona = await axios.get(params.genesisIp+'persona/'+req.params.cedula)
  if(persona.data.cedula_ruc)
    utilities.executeSQL(connection, "INSERT INTO cliente2(cedula_ruc,razon_social) VALUES ('"+persona.data.cedula_ruc+"', '"+persona.data.nombre+"')");
  return res.send();
     

}
module.exports = ctrl;