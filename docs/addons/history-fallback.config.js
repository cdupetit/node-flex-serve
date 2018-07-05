const history = require('connect-history-api-fallback');
const convert = require('koa-connect');

module.exports = {
  context: __dirname,
  addons: {
    add: (app, middleware, options) => {
      const historyOptions = {
        // ... see: https://github.com/bripkens/connect-history-api-fallback#options
      };

      app.use(convert(history(historyOptions)));
    },
  },
};
