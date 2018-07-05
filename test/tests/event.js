const assert = require('power-assert');

const serve = require('../../');
const { load, pause } = require('../util');

const timeout = process.env.CIRCLECI ? 2e3 : 500;

describe('node-flex-serve Events', () => {
  before(pause);
  beforeEach(pause);

  it('should emit the listening event', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    serve({ config }).then((server) => {
      server.on('listening', ({ server: servr, options }) => {
        assert(servr);
        assert(options);
        // occasionally close() will be called before the WebSocket server is up
        setTimeout(() => {
          server.close(done);
        }, timeout);
      });
    });
  }).timeout(15e3);
});
