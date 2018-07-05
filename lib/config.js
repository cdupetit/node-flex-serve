const { isAbsolute, resolve } = require('path');

const isPlainObject = require('lodash/isPlainObject');

const nodeServeSchema = require('./schemas/NodeServeOptions.json');

const loader = require('./config-loader/loader');

function prepare(config) {
  return config;
}

module.exports = {
  load(options) {
    const { config } = options;
    const flags = options.flags || {};
    const require = flags.require || options.require;

    // if someone passed us a config Object, then just resolve that object
    // we're only going to load the config from file when we're given a file
    // to load
    if (isPlainObject(config) || Array.isArray(config)) {
      const result = [].concat(config).map((conf) => prepare(conf));
      return Promise.resolve(result);
    }

    const loaderOptions = {
      allowMissing: true,
      require,
      schema: {
        properties: {
          serve: {
            additionalProperties: false,
            type: 'object',
            properties: nodeServeSchema.properties,
          },
        },
      },
    };

    if (typeof config === 'string') {
      if (isAbsolute(config)) {
        loaderOptions.configPath = config;
      } else {
        loaderOptions.configPath = resolve(process.cwd(), config);
      }
    }

    return loader(loaderOptions).then((result) => {
      let found = result.config;

      if (!found) {
        found = {};
      }

      found = [].concat(found).map((conf) => prepare(conf));

      return found;
    });
  },
};
