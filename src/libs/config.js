const express = require('express');
const routes = require('../routes');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser')
const publicIp = require('public-ip');

const utilities = require('../libs/utilities')
const params = require('../libs/params')


module.exports = app => {
  // Settings
  app.set('port', process.env.PORT || params.port);

  
  // middlewares.
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.static(__dirname + '/../public', {
    etag: false,
    lastModified: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-store')
  }));

  app.use(bodyParser.json({limit: '500mb'}));
  app.use(bodyParser.urlencoded({limit: '500mb', extended: true}));

  app.use(express.json());

  //Get public IP
  (async () => {
    params.publicip = await publicIp.v4();
  })();  
  //Fin

  //main Task
  utilities.task();
  // Routes
  routes(app);

  return app;

};