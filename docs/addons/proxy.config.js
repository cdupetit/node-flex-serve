const nodeServeProxy = require('node-flex-serve-proxy');

const proxyOptions = {
  '/gitapi': {
    target: 'http://api.github.com',
    pathRewrite: {
      '^/gitapi': '',
    },
    changeOrigin: true,
    // ... see: https://github.com/chimurai/http-proxy-middleware#options
  },
  '/swapi': {
    target: 'https://swapi.co/api',
    pathRewrite: {
      '^/swapi': '',
    },
    changeOrigin: true,
  },
};

module.exports = {
  context: __dirname,
  addons: {
    proxy: proxyOptions,
    add: (app, middleware, options) => {
      middleware.content();
      nodeServeProxy.proxy(app, options);
    },
  },
  on: {
    listening: nodeServeProxy.onListening,
  },
};
