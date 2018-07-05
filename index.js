const updateNotifier = require('update-notifier');

const nodelog = require('./lib/log');
const eventbus = require('./lib/bus');
const getOptions = require('./lib/options');
const getServer = require('./lib/server');
const pkg = require('./package.json');

module.exports = (opts) => {
  updateNotifier({ pkg }).notify();

  process.env.NODE_SERVE = true;

  return getOptions(opts)
    .then((results) => {
      const { options } = results;
      const log = nodelog({ name: 'serve', id: 'node-flex-serve' });

      options.bus = eventbus(options);

      const { close, server, start } = getServer(options);

      start(options);

      let closing = false;
      const exit = (signal) => {
        if (!closing) {
          closing = true;
          close(() => {
            log.info(`Process Ended via ${signal}`);
            server.kill();
            process.exit(0);
          });
        }
      };

      for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => exit(signal));
      }

      process.on('exit', exit);

      return Object.freeze({
        close,
        on(...args) {
          options.bus.on(...args);
        },
        options,
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(
        'An error was thrown while starting node-flex-serve.\n  ',
        err
      );
      throw err;
    });
};
