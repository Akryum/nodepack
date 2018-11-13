/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  api.chainWebpack(config => {
    if (process.env.NODE_ENV === 'production') {
      config.set('mode', 'production')
        .devtool(options.productionSourceMap ? 'source-map' : false)

      // disable optimization during tests to speed things up
      if (process.env.NODEPACK_TEST) {
        config.optimization.minimize(false)
      } else {
        const TerserPlugin = require('terser-webpack-plugin')
        const terserOptions = require('./terserOptions')
        config.optimization
          // @ts-ignore
          .minimizer('terser')
          .use(TerserPlugin, [terserOptions(options)])
      }
    }
  })
}
