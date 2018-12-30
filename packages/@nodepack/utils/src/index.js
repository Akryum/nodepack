/** @typedef {import('./globalOptions').Preset} Preset */

module.exports = {
  chalk: require('chalk').default,
  ...require('./configFiles'),
  ...require('./debug'),
  ...require('./deps'),
  ...require('./env'),
  ...require('./files'),
  ...require('./globalOptions'),
  ...require('./logger'),
  ...require('./object'),
  ...require('./openBrowser'),
  ...require('./plugin'),
  ...require('./request'),
  shouldUseTaobao: require('./shouldUseTaobao'),
  ...require('./spinner'),
  ...require('./validate'),
}
