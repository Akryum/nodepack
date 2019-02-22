/** @typedef {import('./globalOptions').Preset} Preset */

module.exports = {
  chalk: require('chalk').default,
  ...require('./configFiles'),
  ...require('./debug'),
  ...require('./deps'),
  ...require('./env'),
  ...require('./files'),
  ...require('./git'),
  ...require('./globalOptions'),
  ...require('./logger'),
  ...require('./object'),
  ...require('./openBrowser'),
  ...require('./pkg'),
  ...require('./plugin'),
  ...require('./request'),
  ...require('./run'),
  shouldUseTaobao: require('./shouldUseTaobao'),
  ...require('./spinner'),
  ...require('./terminate'),
  ...require('./validate'),
}
