const fs = require('fs');

var ctrl = {};
ctrl.file = (req, res) => 
{
  res.download(req.params.file)
};


module.exports = ctrl;