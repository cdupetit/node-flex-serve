# node-flex-serve

A lean, modern, and flexible node server

Node Flex Serve's code is widely inspired from [webpack-serve](https://github.com/webpack-contrib/webpack-serve).

## Getting Started

To begin, you'll need to install `node-flex-serve`:

```console
$ npm install node-flex-serve
```

## CLI

```console
$ node-flex-serve --help

  Options
    --config            The node-flex-serve config to serve. Alias for <config>.
    --content           The path from which content will be served
                        Default: process.cwd()
    --help              Show usage information and the options listed here.
    --host              The host the app should bind to
    --http2             Instruct the server to use HTTP2
    --https-cert        Specify a cert to enable https. Must be paired with a key
    --https-key         Specify a key to enable https. Must be paired with a cert
    --https-pass        Specify a passphrase to enable https. Must be paired with a pfx file
    --https-pfx         Specify a pfx file to enable https. Must be paired with a passphrase
    --log-level         Limit all process console messages to a specific level and above
                        Levels: trace, debug, info, warn, error, silent
    --log-time          Instruct the logger for node-flex-serve and dependencies to display a timestamp
    --no-clipboard      Instructs the server not to copy the server URI to the clipboard when starting
    --open              Instruct the app to open in the default browser
    --open-app          The name of the app to open the app within, or an array
                        containing the app name and arguments for the app
    --open-path         The path with the app a browser should open to
    --port              The port the app should listen on
    --require, -r       Preload one or more modules before loading the add-ons configuration
    --version           Display the node-flex-serve version

  Examples
    $ node-flex-serve ./node-flex-serve.config.js
    $ node-flex-serve --config ./node-flex-serve.config.js --port 1337
    $ node-flex-serve --port 1337  # config can be omitted
```

_Note: The CLI will use your local install of node-flex-serve when available,
even when run globally._

### Running the CLI

There are a few variations for using the base CLI command, and starting
`node-flex-serve`:

```console
  $ node-flex-serve ./webpnode-serveack.config.js
  $ node-flex-serve --config ./node-flex-serve.config.js
```

Those two commands are synonymous. Both instruct `node-flex-serve` to load the
config from the specified path. We left the flag in there because some folks
like to be verbose, so why not.

```console
  $ node-flex-serve
```

## `node-flex-serve` Config

You can store and define configuration / options for `node-flex-serve` in a number
of different ways. This module leverages [cosmiconfig](https://github.com/davidtheclark/cosmiconfig),
which allows you to define `node-flex-serve` options in the following ways:

- in your package.json file in a `serve` property
- in a `.serverc` or `.serverc.json` file, in either JSON or YML.
- in a `serve.config.js` file which exports a CommonJS module.

### Webpack Config `serve` Property

`node-flex-serve` supports the `serve` property in your config file, which
may contain any of the supported [options](#options).

## API

When using the API directly, the main entry point  is the `serve` function, which
is the default export of the module.

```js
const serve = require('node-flex-serve');
const config = require('./node-flex-serve.config.js');

serve({ config });
```

### serve([options])

Returns [a `Promise` which resolves] an `Object` containing:

- `close()` *(Function)* - Closes the server and its dependencies.
- `on(eventName, fn)` *(Function)* - Binds a serve event to a function. See
[Events](#events).

#### options

Type: `Object`

Options for initializing and controlling the server provided.

##### addons

Please see [Add-On Features](#add-on-features).

##### context

Type: `String|[String]`  
Default: `process.cwd()`

The path, or array of paths, from which static content will be served.

<!-- intentionally out of alphabetic order -->
##### clipboard

Type: `Boolean`  
Default: `true`

If true, the server will copy the server URI to the clipboard when the server is
started.

##### host

Type: `String`  
Default: `'localhost'`

Sets the host that the server will listen on. eg. `'10.10.10.1'`

_Note: This value must match any value specified for `hot.host` or
`hot.host.server`, otherwise `node-flex-serve` will throw an error. This
requirement ensures that the `koa` server and `WebSocket` server play nice
together._

##### http2

Type: `Boolean`  
Default: `false`

If using Node v9 or greater, setting this option to `true` will enable HTTP2
support.

##### https

Type: `Object`  
Default: `null`

Passing this option will instruct `node-flex-serve` to create and serve the content
through a secure server. The object should contain properties matching:

```js
{
  key: fs.readFileSync('...key'),   // Private keys in PEM format.
  cert: fs.readFileSync('...cert'), // Cert chains in PEM format.
  pfx: <String>,                    // PFX or PKCS12 encoded private key and certificate chain.
  passphrase: <String>              // A shared passphrase used for a single private key and/or a PFX.
}
```

See the [Node documentation][https-opts] for more information. For SSL
Certificate generation, please read the
[SSL Certificates for HTTPS](#ssl-certificates-for-https) section.

##### logLevel

Type: `String`  
Default: `info`

Instructs `node-flex-serve` to output information to the console/terminal at levels
higher than the specified level. Valid levels:

```js
[
  'trace',
  'debug',
  'info',
  'warn',
  'error'
]
```

##### logTime

Type: `Boolean`  
Default: `false`

Instruct `node-flex-serve` to prepend each line of log output with a `[HH:mm:ss]`
timestamp.

##### on

Type: `Object`  
Default: `null`

While running `node-flex-serve` from the command line, it can sometimes be useful
to subscribe to events from the module's event bus _within your config_. This
option can be used for that purpose. The option's value must be an `Object`
matching a `key:handler`, `String: Function` pattern. eg:

```js
on: {
  'listening': () => { console.log('listening'); }
}
```

##### open

Type: `Boolean|Object`  
Default: `false`

Instruct the module to open the served bundle in a browser. Accepts an `Object`
that matches:

```js
{
  app: <String>, // The proper name of the browser app to open.
  path: <String> // The url path on the server to open.
}
```

_Note: Using the `open` option will disable the `clipboard` option._

##### port

Type: `Number`  
Default: `8080`

The port the server should listen on.

## Events

The server created by `node-flex-serve` emits select events which can be
subscribed to. All events are emitted with a single `Object` parameter,
containing named properties for relevant data.

For example:

```js
const serve = require('node-flex-serve');
const config = require('./node-flex-serve.config.js');

serve({ config }).then((server) => {
  server.on('listening', ({ server, options }) => {
    console.log('happy fun time');
  });
});
```

#### listening

Arguments:  
  `Koa` _server_  
  `Object` _options_

Emitted when the server begins listening for connections.

## SSL Certificates for HTTPS

We do recommend a path for users to generate their own SSL Certificates
safely and efficiently. That path resides in
[`devcert-cli`](https://github.com/davewasmer/devcert-cli); an excellent project
that automates the creation of trusted SSL certificates that will work
wonderfully with `node-flex-serve`.

## Add-on Features

A core tenant of `node-flex-serve` is to stay lean in terms of feature set, and to
empower users with familiar and easily portable patterns. This
makes the module far easier to maintain, which ultimately benefits the user.

Luckily, flexibility baked into `node-flex-serve` makes it a snap to add-on features.
You can leverage this by using the `add` option. The value of the option should
be a `Function` matching the following signature:

```js
add: (app, middleware, options) => {
  // ...
}
```

### `add` Function Parameters

- `app` The underlying Koa app
- `middleware` An object containing accessor functions to call both
the `koa-static` middleware.
- `options` - The internal options object used by `node-flex-serve`

Some add-on patterns may require changing the order of middleware used in the
`app`. For instance, if adding routes or using a separate router with the `app`
where routes must be added last, you'll need to call the `middleware` functions
early on. `node-flex-serve` recognizes these calls and will not execute them again.
If these calls were omitted, `node-flex-serve` would execute both in the default,
last in line, order.

```js
add: (app, middleware, options) => {
  // since we're manipulating the order of middleware added, we need to handle
  // adding these two internal middleware functions.
  middleware.proxy();
  middleware.content();

  // router *must* be the last middleware added
  app.use(router.routes());
}
```

Listed below are some of the add-on patterns and recipes that can be found in
`docs/addons`:

- [bonjour](docs/addons/bonjour.config.js)
- [express compress](docs/addons/compress/express-compress.config.js)
- [koa compress](docs/addons/compress/koa-compress.config.js)
- [historyApiFallback](docs/addons/history-fallback.config.js)
- [proxy + history fallback](docs/addons/proxy-history-fallback.config.js)
- [proxy](docs/addons/proxy.config.js)
- [staticOptions](docs/addons/static-content-options.config.js)
- [useLocalIp](docs/addons/local-ip.config.js)

## Contributing

We welcome your contributions! Please have a read of
[CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to get involved.

## License

#### [MIT](./LICENSE)
