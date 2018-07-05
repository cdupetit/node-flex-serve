#!/usr/bin/env node

if (!module.parent) {
  // eslint-disable-next-line global-require
  const { register } = require('./lib/global');

  register();
}

const chalk = require('chalk');
const cosmiconfig = require('cosmiconfig');
const debug = require('debug')('node-flex-serve');
const meow = require('meow');
const merge = require('lodash/merge');
const importLocal = require('import-local'); // eslint-disable-line import/order

// Prefer the local installation of node-flex-serve
/* istanbul ignore if */
if (importLocal(__filename)) {
  debug('Using local install of node-flex-serve');
}

const serve = require('./');

const cli = meow(
  chalk`
{underline Usage}
  $ node-flex-serve <config> [...options]

{underline Options}
  --config            The node flex serve config to serve. Alias for <config>.
  --content           The path from which content will be served
  --help              Show usage information and the options listed here.
  --host              The host the app should bind to
  --http2             Instruct the server to use HTTP2
  --https-cert        Specify a cert to enable https. Must be paired with a key
  --https-key         Specify a key to enable https. Must be paired with a cert
  --https-pass        Specify a passphrase to enable https. Must be paired with a pfx file
  --https-pfx         Specify a pfx file to enable https. Must be paired with a passphrase
  --log-level         Limit all process console messages to a specific level and above
                      {dim Levels: trace, debug, info, warn, error, silent}
  --log-time          Instruct the logger for node-flex-serve and dependencies to display a timestamp
  --open              Instruct the app to open in the default browser
  --open-app          The name of the app to open the app within, or an array
                      containing the app name and arguments for the app
  --open-path         The path with the app a browser should open to
  --port              The port the app should listen on
  --require, -r       Preload one or more modules before loading the add-ons configuration
  --version           Display the node-flex-serve version

{underline Examples}
  $ node-flex-serve ./node-flex-serve.config.js
  $ node-flex-serve --config ./node-flex-serve.config.js --port 1337
  $ node-flex-serve # config can be omitted
`,
  {
    flags: {
      require: {
        alias: 'r',
        type: 'string',
      },
    },
  }
);

const flags = Object.assign({}, cli.flags);
const explorer = cosmiconfig('serve', {});
const { config } = explorer.searchSync() || {};
const options = merge({ flags }, config);

if (cli.input.length) {
  [options.config] = cli.input;
} else if (flags.config) {
  options.config = flags.config;
}

serve(options).catch(() => {
  process.exit(1);
});
