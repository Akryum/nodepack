/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  api.chainWebpack(config => {
    if (process.env.NODE_ENV === 'production') {
      config.set('mode', 'production')
        .devtool(options.productionSourceMap ? 'source-map' : false)

      // disable optimization during tests to speed things up
      if (options.minify === false || process.env.NODEPACK_TEST || process.env.NODEPACK_MAINTENANCE_FRAGMENTS) {
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
