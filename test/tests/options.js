const { readFileSync: read } = require('fs');
const path = require('path');

const assert = require('power-assert');
const clip = require('clipboardy');
const fetch = require('node-fetch');
const mock = require('mock-require');

const { parse } = require('../../lib/options');
const util = require('../util');

const nodeVersion = parseInt(process.version.substring(1), 10);

const { load, pause, serve, t } = util;
let hook;

mock('opn', (...args) => {
  hook(...args);
});

describe('node-flex-serve Options', () => {
  before(pause);
  beforeEach(pause);
  afterEach(() => {
    hook = null;
  });

  t('should parse json', () => {
    assert(parse('{}'));
  });

  t('should handle failed parse', () => {
    assert(parse('asd') === 'asd');
    assert(parse([]) == null);
  });

  t('should accept a addons add option', (done) => {
    const config = load('./fixtures/htm/node-flex-serve.config.js');
    config.serve = {
      addons: {
        add: (app, middleware) => {
          middleware.content({
            index: 'index.htm',
          });
        },
      },
    };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should accept a content option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.content = path.resolve(__dirname, '../fixtures/content');

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should accept a clipboard option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.clipboard = false;
    clip.writeSync('foo');

    serve({ config }).then((server) => {
      server.on('listening', () => {
        assert.equal(clip.readSync(), 'foo');
        server.close(done);
      });
    });
  });

  t('should accept a host option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.host = '0.0.0.0';

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('http://0.0.0.0:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  if (nodeVersion < 9) {
    t('should reject the http2 for Node < 9', (done) => {
      const config = load('./fixtures/basic/node-flex-serve.config.js');
      config.serve.http2 = true;

      serve({ config }).catch((err) => {
        assert(err);
        done();
      });
    });
  } else {
    // https://nodejs.org/api/http2.html#http2_client_side_example
    t('should accept a http2 option', (done) => {
      const config = load('./fixtures/basic/node-flex-serve.config.js');
      config.serve.http2 = true;

      serve({ config }).then((server) => {
        server.on('listening', () => {
          assert(server.options.http2);
          setTimeout(() => server.close(done), 1000);
        });
      });
    });
  }

  t('should accept an https cert/key', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.https = {
      cert: path.join(__dirname, '../fixtures/test_cert.pem'),
      key: path.join(__dirname, '../fixtures/test_key.pem'),
    };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should accept an https cert/key Buffer', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.https = {
      cert: read(path.join(__dirname, '../fixtures/test_cert.pem')),
      key: read(path.join(__dirname, '../fixtures/test_key.pem')),
    };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should accept an https pfx/passphrase', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.https = {
      passphrase: 'sample',
      pfx: path.join(__dirname, '../fixtures/test_cert.pfx'),
    };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should accept an https pfx/passphrase Buffer', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.https = {
      passphrase: 'sample',
      pfx: read(path.join(__dirname, '../fixtures/test_cert.pfx')),
    };

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  // logLevel and logTime option tests can be found in ./log.js

  t('should accept an open:Boolean option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.open = true;
    clip.writeSync('foo');

    serve({ config }).then(({ close }) => {
      hook = (...args) => {
        // the open option should disable the clipboard feature
        assert.equal(clip.readSync(), 'foo');
        assert.equal(args[0], 'http://localhost:8080');
        assert.equal(Object.keys(args[1]), 0);
        close(done);
      };
    });
  });

  t('should accept an open:Object option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    const opts = { app: 'Firefox', path: '/foo' };
    config.serve.open = opts;

    serve({ config }).then(({ close }) => {
      hook = (...args) => {
        assert.equal(args[0], 'http://localhost:8080/foo');
        assert.equal(args[1], 'Firefox');
        close(done);
      };
    });
  });

  // NOTE: we have to test this here as we have no means to hook opn via the cli
  // tests
  t('should accept --open-* flags', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    const flags = {
      openApp: '["Firefox","--some-arg"]',
      openPath: '/some-path',
    };

    serve({ config, flags }).then(({ close }) => {
      hook = (...args) => {
        assert.equal(args[0], 'http://localhost:8080/some-path');
        assert.deepEqual(args[1], JSON.parse(flags.openApp));
        close(done);
      };
    });
  });

  t('should accept a port option', (done) => {
    const config = load('./fixtures/basic/node-flex-serve.config.js');
    config.serve.port = '1337';

    serve({ config }).then((server) => {
      server.on('listening', () => {
        fetch('http://localhost:1337').then((res) => {
          assert(res.ok);
          server.close(done);
        });
      });
    });
  });

  t('should merge child options', (done) => {
    const config = load(
      './fixtures/basic/node-flex-serve.options-merge.config.js',
      false
    );
    serve({ config }).then((server) => {
      assert(server.options);

      setTimeout(() => server.close(done), 1000);
    });
  });
});
