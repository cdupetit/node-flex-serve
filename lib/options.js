const fs = require('fs');
const path = require('path');

const merge = require('lodash/merge');

const nodelog = require('./log');

const { load } = require('./config');

const defaults = {
  clipboard: true,
  config: {},
  content: [],
  flags: {},
  host: 'localhost',
  http2: false,
  https: null,
  // https: {
  //   key: fs.readFileSync('...key'),
  //   cert: fs.readFileSync('...cert'),
  //   pfx: ...,
  //   passphrase: ...
  // },
  logLevel: 'info',
  logTime: false,
  open: false,
  // open: { app: <String>, path: <String> }
  port: 8080,
  protocol: 'http',
};

function parse(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    if (typeof value === 'string') {
      return value;
    }

    process.emitWarning(e);
    return null;
  }
}

function pull(obj, prefix) {
  let result;
  for (const key of Object.keys(obj)) {
    if (key.indexOf(prefix) === 0) {
      if (!result) {
        result = {};
      }
      const name = key.replace(prefix, '').toLowerCase();
      result[name] = obj[key];
    }
  }
  return result;
}

module.exports = (opts) => {
  const flags = opts.flags || {};
  const nodeVersion = parseInt(process.version.substring(1), 10);

  return load(opts).then((configs) => {
    const [first] = configs;
    const options = merge({}, defaults, first, first.serve, opts, flags);
    const httpsFlags = pull(flags, 'https');
    const openFlags = pull(flags, 'open');

    if (httpsFlags) {
      options.https = httpsFlags;
    }

    if (options.https) {
      const { https } = options;
      for (const property of ['cert', 'key', 'pfx']) {
        const value = https[property];
        const isBuffer = value instanceof Buffer;

        if (value && !isBuffer) {
          // lstat seems to have a hard limit at 260
          if (value.length < 260 && fs.lstatSync(value).isFile()) {
            https[property] = fs.readFileSync(path.resolve(value));
          }
        }
      }

      if (https.pass) {
        https.passphrase = https.pass;
        delete https.pass;
      }
      options.protocol = 'https';
      options.https = https;
    }

    /* istanbul ignore if */
    if (openFlags) {
      if (!openFlags.path) {
        openFlags.path = '/';
      }
      options.open = openFlags;
    }

    if (typeof options.content === 'string') {
      options.content = [options.content];
    }

    if (!options.content || !options.content.length) {
      // if no context was specified in a config, and no --content options was
      // used, then we need to derive the context, and content location, from
      // the compiler.
      if (first.context) {
        options.content = [].concat(first.context);
      }

      options.content.push(process.cwd());
    }

    /* istanbul ignore if */
    if (options.http2 && nodeVersion < 9) {
      throw new TypeError(
        'node-flex-serve: The `http2` option can only be used with Node v9 and higher.'
      );
    }

    /* istanbul ignore if */
    if (flags.openApp) {
      options.open = Object.assign({}, options.open, {
        app: parse(flags.openApp),
      });
    }

    /* istanbul ignore if */
    if (flags.openPath) {
      options.open = Object.assign({}, options.open, {
        path: flags.openPath,
      });
    }

    if (flags.logLevel) {
      options.logLevel = flags.logLevel;
    }

    if (flags.logTime) {
      options.logTime = true;
    }

    // initialize the shared log
    nodelog({
      name: 'serve',
      id: 'node-flex-serve',
      level: options.logLevel,
      timestamp: options.logTime,
    });

    // cleanup - doing this here so as not to mutate the options passed in.
    delete options.config;

    // this isn't part of the node flex serve options schema, and doesn't need to be
    delete configs[0].serve; // eslint-disable-line no-param-reassign

    return { configs, options };
  });
};

// this is exported so we can get coverage on the function
// not intended to be used externally
module.exports.parse = parse;
