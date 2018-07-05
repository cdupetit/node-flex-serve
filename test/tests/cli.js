const path = require('path');

const assert = require('power-assert');
const execa = require('execa');
const fetch = require('node-fetch');
const strip = require('strip-ansi');

const { pause, t, timeout } = require('../util');

const cliPath = path.resolve(__dirname, '../../cli.js');
const configPath = path.resolve(
  __dirname,
  '../fixtures/basic/node-flex-serve.config.js'
);

// NOTE: keep this around in case we need to examine the output from a command
// function pipe(proc) {
//   // eslint-disable-line no-unused-vars
//   const stream = proc.stdout;
//   stream.pipe(process.stdout);
// }

function x(fn, ...args) {
  const proc = execa(...args);
  const ready = new RegExp('ℹ ｢serve｣: Project is running');

  proc.stdout.on('data', (data) => {
    if (ready.test(data.toString())) {
      fn(proc);
    }
  });

  // pipe(proc);

  return proc;
}

describe('node-flex-serve CLI', () => {
  before(pause);
  beforeEach(pause);

  t('should show help with --help', (done) => {
    const proc = execa(cliPath, ['--help']);

    proc.then((result) => {
      assert(strip(result.stdout).indexOf('Usage') > 0);
      done();
    });
  });

  t('should run node-flex-serve [config]', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      [configPath]
    );
  });

  t('should run node-flex-serve --config', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath]
    );
  });

  t('should run node-flex-serve and find the config', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      { cwd: path.resolve(__dirname, '../fixtures/basic') }
    );
  });

  t('should use the --content flag', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/content/node-flex-serve.config.js'
    );
    const contentPath = path.join(__dirname, '../fixtures/content');

    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', confPath, '--content', contentPath]
    );
  });

  t('should use the --host flag', (done) => {
    x(
      (proc) => {
        fetch('http://0.0.0.0:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--host', '0.0.0.0']
    );
  });

  // need to get devcert documentation going and then write tests
  // for the http2 test: https://nodejs.org/api/http2.html#http2_client_side_example
  // t('should use the --http2 flag');

  t('should use the --https-cert / --https-key flag', (done) => {
    const certPath = './test/fixtures/test_cert.pem';
    const keyPath = './test/fixtures/test_key.pem';
    x(
      (proc) => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--https-cert', certPath, '--https-key', keyPath]
    );
  });

  t('should use the --https-pfx / --https-pass flag', (done) => {
    const certPath = './test/fixtures/test_cert.pfx';
    x(
      (proc) => {
        fetch('https://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      [
        '--config',
        configPath,
        '--https-pfx',
        certPath,
        '--https-pass',
        'sample',
      ]
    );
  });

  t('should use the --log-level flag', (done) => {
    const proc = execa(cliPath, [
      '--config',
      configPath,
      '--log-level',
      'silent',
    ]);

    proc.then((result) => {
      assert.equal(result.stdout, '');
      done();
    });

    setTimeout(() => {
      // resolves the proc promise
      proc.kill('SIGINT');
    }, timeout);
  });

  t('should use the --log-time flag', (done) => {
    const proc = execa(cliPath, ['--config', configPath, '--log-time']);

    proc.then((result) => {
      const lines = result.stdout
        .split('\n')
        .map((l) => strip(l))
        .filter((l) => l.indexOf('ℹ ｢') > 0);

      assert(lines.length > 0);

      for (const line of lines) {
        assert(/^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/.test(line));
      }

      done();
    });

    proc.stdout.pipe(process.stdout);

    setTimeout(() => {
      // resolves the proc promise
      proc.kill('SIGINT');
    }, timeout);
  });

  t('should use the --port flag', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:1337').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--port', 1337]
    );
  });

  t('should exit on thrown Error', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/basic/node-flex-serve.config-error.config.js'
    );
    const proc = x(() => {}, cliPath, ['--config', confPath]);

    proc.catch(() => {
      assert(true);
      done();
    });
  });

  t('should use the --require flag', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/basic/node-flex-serve.env.config.js'
    );
    const requireCwd = path.dirname(confPath);
    const requirePath = './preload-env.js';
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--require', requirePath],
      { cwd: requireCwd }
    );
  });
});
