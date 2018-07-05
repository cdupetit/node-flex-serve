module.exports = {
  context: __dirname,
  addons: {
    add: (app, middleware, options) => {
      // pass desired options here. eg.
      middleware.content({
        index: 'index.aspx',
        // see: https://github.com/koajs/static#options
      });
    },
  },
};
