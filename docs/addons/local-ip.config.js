const internalIp = require('internal-ip');

module.exports = {
  context: __dirname,
  host: internalIp.v4.sync(),
};
