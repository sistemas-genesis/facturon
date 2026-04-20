const moment = require("moment");
const express = require("express");
const Sybase = require("sybase");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const nodemailer = require("nodemailer");
const parseString = require("xml2js").parseString;

const params = require("../libs/params");
const utilities = require("../libs/utilities");
const ride = require("../libs/ridePdfmake");

var ctrl = {};
ctrl.get = (req, res) => {
  const fecha = req.body.params.fecha_autorizacion ? 'fecha_autorizacion' : 'fecha_comprobante';
  const connection = utilities.dbConnection(req.params.db);
  let query = ""
    + "SELECT ce_id, ruc_emisor, ruc_comprador, "
    + "       nombre_comprador = web_clear_special(nombre_comprador), "
    + "       fecha_comprobante, numero_comprobante, clave_acceso, "
    + "       numero_autorizacion, fecha_autorizacion, tipo_comprobante "
    + "FROM ce_comprobante "
    + "WHERE (ruc_comprador = '" + req.params.cedula_ruc + "' "
    + "   OR ruc_comprador = SUBSTR('" + req.params.cedula_ruc + "',0,11) "
    + "   OR ruc_comprador = '" + req.params.cedula_ruc + "' + '001') "
    + "  AND estado = 4 "
    + "  AND DATE(" + fecha + ") >= '" + req.params.start + "' "
    + "  AND DATE(" + fecha + ") <= '" + req.params.end + "' "
    + "  AND ruc_comprador <> '9999999999999' "
    + "  AND '" + req.body.empresas + "' LIKE '%'+ruc_emisor+'%' "
    + "  AND ('" + req.body.estacion + "' LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = '" + req.body.estacion + "') "
    + "  AND ('" + req.body.punto + "' LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ','= '" + req.body.punto + "') "
    + "  AND '" + req.body.tipos + "' LIKE '%,'+tipo_comprobante+',%'";
  const db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect(err => {
    if (err) console.log(err);
    db.query(query, async (err, data) => {
      if (err) console.log(err);
      res.json(data);
      db.disconnect();
    });
  });
};

ctrl.getLike = (req, res) => {
  const fecha = req.body.params.fecha_autorizacion
    ? 'fecha_autorizacion' : 'fecha_comprobante';
  const connection = utilities.dbConnection(req.params.db);
  const query =
    "SELECT ce_id, " +
    " ruc_emisor,ruc_comprador, " +
    " nombre_comprador = web_clear_special(nombre_comprador), " +
    " fecha_comprobante, numero_comprobante,clave_acceso, " +
    " numero_autorizacion,fecha_autorizacion,tipo_comprobante " +
    "FROM ce_comprobante " +
    "WHERE DATE(" + fecha + ") >= '" + req.params.start + "' " +
    " AND DATE(" + fecha + ") <= '" + req.params.end + "' " +
    " AND '" + req.body.empresas + "' LIKE '%'+ruc_emisor+'%' " +
    " AND ('" + req.body.estacion + "' LIKE '%'+SUBSTR(numero_comprobante, 0,4)+'%' OR ',' = '" + req.body.estacion + "') " +
    " AND ('" + req.body.punto + "' LIKE '%'+SUBSTR(numero_comprobante, 5,3)+'%' OR ',' = '" + req.body.punto + "') " +
    " AND '" + req.body.tipos + "' LIKE '%,'+tipo_comprobante+',%'";
  const db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect(err => {
    if (err) console.log(err);
    db.query(query, async (err, data) => {
      if (err) console.log(err);
      res.json(data);
      db.disconnect();
    });
  });
};

ctrl.getXmlById = (req, res) => {
  const connection = utilities.dbConnection(req.params.db);
  const { id } = req.params;

  const q = "SELECT TOP 1 ce_xml FROM ce_comprobante WHERE ce_id = " + id;
  const db = new Sybase(connection.host, connection.port, connection.db, connection.user, connection.pass);
  db.connect(err => {
    if (err) return res.status(500).json({ success: false, msg: err.message });

    db.query(q, (err, rows) => {
      db.disconnect();
      if (err) return res.status(500).json({ success: false, msg: err.message });
      if (!rows || !rows[0] || !rows[0].ce_xml) {
        return res.status(404).json({ success: false, msg: 'XML no disponible' });
      }
      let xml = rows[0].ce_xml;
      xml = xml.replace(/\0/g, '');
      xml = xml.replace(/[\u0000-\u001F\u007F]/g, '');
      xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.send(xml);
    });
  });
};

ctrl.rideFactura = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderFactura(result.factura, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideRetencion = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderRetencion(result.comprobanteRetencion, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideRetencion2 = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderRetencion2(result.comprobanteRetencion, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideCredito = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderCredito(result.notaCredito, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideDebito = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderDebito(result.notaDebito, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideRemision = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderRemision(result.guiaRemision, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

ctrl.rideLiquidacion = (req, res) => {
  parseString(req.body.xml, async (err, result) => {
    try {
      await ride.renderLiquidacion(result.liquidacionCompra, req.params.fechaAutorizacion, res);
    } catch (e) {
      console.error(e);
      return res.status(500).send();
    }
  });
};

module.exports = ctrl;
