const assert = require('power-assert');
const clip = require('clipboardy');

const { load, serve, t } = require('../util');

const logLevel = 'info';

describe('node-flex-serve API', () => {
  it('should exist', () => assert(serve));

  it('should export', () => {
    assert(typeof serve === 'function');
  });

  t('should serve', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    serve({ config }).then((server) => {
      assert(server);
      assert(typeof server.close === 'function');
      assert(typeof server.on === 'function');

      setTimeout(() => server.close(done), 1000);
    });
  });

  t('should serve with <Function> config', (done) => {
    const config = './test/fixtures/basic/node-flex-serve.function.config.js';
    serve({
      config,
      logLevel,
      dev: { logLevel },
      hot: { logLevel },
    }).then((server) => {
      assert(server);

      setTimeout(() => server.close(done), 1000);
    });
  });

  t('should have copied the uri to the clipboard', () => {
    assert.equal(clip.readSync(), 'http://localhost:8080');
  });
});
