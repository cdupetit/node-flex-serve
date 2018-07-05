const compress = require('koa-compress');

module.exports = {
  context: __dirname,
  addons: {
    add: (app, middleware, options) => {
      app.use(compress());
    },
  },
};
