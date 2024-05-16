const fs = require('fs')

const ctrl = {};

ctrl.get = (req, res) => 
{
	res.sendfile('./src/public/index.html');

};

ctrl.config = (req, res) => 
{
	res.sendfile('./src/public/config.html');

};


module.exports = ctrl;