const { relative } = require('path');
const http = require('http');
const https = require('https');

const chalk = require('chalk');
const clip = require('clipboardy');
const getPort = require('get-port');
const killable = require('killable');
const Koa = require('koa');
const serveStatic = require('@shellscape/koa-static/legacy');
const urljoin = require('url-join');

const nodelog = require('./log');

module.exports = (options) => {
  const app = new Koa();
  const { bus } = options;
  const log = nodelog({ name: 'serve', id: 'node-flex-serve' });
  let http2;
  let server;

  const middleware = {
    content: (staticOptions) => {
      middleware.content.called = true;

      const formattedPaths = options.content
        .map((dir) => relative(process.cwd(), dir))
        .map((dir) => `/${dir}/`);

      if (formattedPaths.length === 1) {
        log.info(
          chalk`Serving Static Content from: {grey ${formattedPaths[0]}}`
        );
      } else {
        let logMessage = 'Serving Static Content from:\n';
        for (const dir of formattedPaths) {
          logMessage += chalk`    {grey ${dir}}\n`;
        }
        log.info(logMessage);
      }

      for (const dir of options.content) {
        app.use(serveStatic(dir, staticOptions || {}));
      }
    },
  };

  if (options.http2) {
    // the check for if we can do this is in options.js
    http2 = require('http2'); // eslint-disable-line
  }

  if (options.https) {
    if (http2) {
      server = http2.createSecureServer(options.https, app.callback());
    } else {
      server = https.createServer(options.https, app.callback());
    }
  } else {
    server = (http2 || http).createServer(app.callback());
  }

  killable(server);

  server.on('error', (err) => log.error(err));

  return {
    server,
    close(callback) {
      server.kill(() => {
        bus.emit('close', { server, options });
        callback();
      });
    },
    start() {
      server.once('listening', () => {
        const uri = `${options.protocol}://${options.host}:${options.port}`;

        log.info(chalk`Project is running at {blue ${uri}}`);

        if (options.clipboard && !options.open) {
          /* istanbul ignore next*/
          try {
            clip.writeSync(uri);
            log.info(chalk.grey('Server URI copied to clipboard'));
          } catch (error) {
            log.warn(
              chalk.grey(
                'Failed to copy server URI to clipboard. ' +
                  "Use logLevel: 'debug' for more information."
              )
            );
            log.debug(error);
          }
        }

        bus.emit('listening', { server, options });

        if (options.open) {
          const open = require('opn'); // eslint-disable-line global-require
          open(urljoin(uri, options.open.path || ''), options.open.app || {});
        }
      });

      return getPort({ port: options.port, host: options.host }).then(
        (port) => {
          /* eslint-disable no-param-reassign */
          options.port = port;

          if (options.addons && typeof options.addons.add === 'function') {
            options.addons.add(app, middleware, options);
          }

          if (!middleware.content.called) {
            middleware.content();
          }

          server.listen(options.port, options.host);

          return server;
        }
      );
    },
  };
};
