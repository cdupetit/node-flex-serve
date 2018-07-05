const assert = require('power-assert');
const sinon = require('sinon');
const strip = require('strip-ansi');

const { load, pause, serve, t } = require('../util');

const nodelog = require('../../lib/log');

const log = console;
const og = {
  info: log.info,
  warn: log.warn,
  error: log.error,
};

function spy() {
  const noop = () => {};
  const sandbox = sinon.sandbox.create();

  log.info = noop;
  log.warn = noop;
  log.error = noop;

  sandbox.spy(log, 'info');
  sandbox.spy(log, 'warn');
  sandbox.spy(log, 'error');

  return sandbox;
}

function restore(sandbox) {
  log.info = og.info;
  log.warn = og.warn;
  log.error = og.error;
  sandbox.restore();
}

describe('node-flex-serve Logging', () => {
  before(pause);
  beforeEach(function be(done) {
    // eslint-disable-line prefer-arrow-callback
    nodelog.delLogger('node-flex-serve');
    pause.call(this, done);
  });

  after(() => nodelog.delLogger('node-flex-serve'));

  t('should accept a logTime option', (done) => {
    const sandbox = spy();
    const config = load('./fixtures/basic/node-flex-serve.config.js', false);
    config.serve = { logTime: true };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        const calls = log.info.getCalls();

        assert(log.info.callCount > 0);

        for (const call of calls) {
          const arg = strip(call.args[0]);
          if (arg.indexOf('｢serve｣') > 0) {
            assert(/^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/.test(arg));
          }
        }

        restore(sandbox);
        server.close(done);
      });
    });
  });
});
