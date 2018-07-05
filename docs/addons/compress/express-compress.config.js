const compress = require('compression');
const convert = require('koa-connect');

module.exports.serve = {
  context: __dirname,
  addons: {
    add: (app, middleware, options) => {
      app.use(convert(compress()));
    },
  },
};
