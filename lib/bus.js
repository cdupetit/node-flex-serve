const isPlainObject = require('lodash/isPlainObject');
const nanobus = require('nanobus');

const nodelog = require('../lib/log');

const NodeServeError = require('./NodeServeError');

module.exports = (options) => {
  const log = nodelog({ name: 'serve', id: 'node-flex-serve' });
  const bus = nanobus();

  if (isPlainObject(options.on)) {
    for (const event of Object.keys(options.on)) {
      const fn = options.on[event];

      if (typeof fn === 'function') {
        log.info(`Subscribed to '${event}' event`);
        bus.on(event, fn);
      } else {
        throw new NodeServeError(
          `The value for an \`on\` event handler must be a Function. event: ${event}`
        );
      }
    }
  } else if (options.on) {
    throw new NodeServeError(
      'The value for the `on` option must be an Object. Please see the README.'
    );
  }

  return bus;
};
