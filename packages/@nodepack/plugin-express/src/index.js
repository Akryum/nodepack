/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  api.addRuntimeModule('./runtime/index.js')

  api.chainWebpack(config => {
    config.module
      .rule('ejs')
      .test(/\.ejs$/)
      .use('ejs-loader')
      .loader('ejs-webpack-loader')
      .options({
        htmlmin: true,
      })
  })
}
