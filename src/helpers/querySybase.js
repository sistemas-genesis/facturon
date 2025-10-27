const Sybase = require("sybase");

module.exports = (db = new Sybase(), query) => {
  return new Promise((resolve) => {
    db.query(query, (err, data) => {
      resolve(data);
    });
  });
};
