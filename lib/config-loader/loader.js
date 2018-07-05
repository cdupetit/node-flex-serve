const merge = require('merge-options');

const nodeServeSchema = require('../schemas/NodeServeOptions.json');
const validate = require('../schema-utils/validate-options');
const nodelog = require('../log');

const load = require('./load');
const resolve = require('./resolve');

module.exports = (options = {}) => {
  nodelog({ name: 'config', id: 'node-flex-serve-config-loader' });

  const name = 'config-loader';
  const raw = load(options);

  return resolve(raw).then((result) => {
    const schema = merge({}, options.schema, nodeServeSchema);
    for (const target of [].concat(result.config)) {
      validate({ name, schema, target });
    }

    return result;
  });
};
