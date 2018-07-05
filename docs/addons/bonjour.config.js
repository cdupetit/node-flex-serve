const bonjour = require('bonjour')(); // eslint-disable-line

function broadcast(data) {
  const { server } = data;
  bonjour.publish({
    name: `Some Bitchin' App`,
    port: server.address().port,
    type: 'http',
    subtypes: ['node'],
  });
}

function close() {
  bonjour.unpublishAll(() => {
    bonjour.destroy();
  });
}

module.exports = {
  context: __dirname,
  on: {
    listening: broadcast,
    close,
  },
};
