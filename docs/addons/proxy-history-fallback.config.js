const convert = require('koa-connect');
const history = require('connect-history-api-fallback');
const proxy = require('http-proxy-middleware');

module.exports = {
  context: __dirname,
  addons: {
    add: (app, middleware, options) => {
      app.use(convert(proxy('/api', { target: 'http://localhost:8081' })));
      app.use(convert(history()));
    },
  },
};
