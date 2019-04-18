/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  api.chainWebpack(config => {
    if (process.env.NODE_ENV !== 'production') {
      config.set('mode', 'development')

      if (process.env.NODEPACK_IS_BUILD !== 'true') {
        const { DEV_PATH } = require('../const')
        config.output
          .path(api.resolve(DEV_PATH))
      }

      config.devtool('source-map')

      // Plugins
      config.plugin('diagnose-error')
        .use(require('../webpack/DiagnoseErrorPlugin'), [api.service])
    }
  })

  require('./error-diagnosers')(api, options)
}
