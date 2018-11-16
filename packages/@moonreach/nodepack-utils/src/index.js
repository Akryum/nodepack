module.exports = {
  chalk: require('chalk').default,
  ...require('./deps'),
  ...require('./env'),
  ...require('./global-options'),
  ...require('./logger'),
  ...require('./module'),
  ...require('./object'),
  ...require('./openBrowser'),
  ...require('./plugin'),
  ...require('./request'),
  ...require('./validate'),
}
