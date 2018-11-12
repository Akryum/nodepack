/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  const resolveLocal = require('../util/resolveLocal')

  api.chainWebpack(config => {
    // Basics
    config
      // Target
      .target('node')
      .set('node', false)
      // Entry
      .entry('app')
        .add(api.resolve(options.entry))
      .end()
      .context(api.getCwd())

    // Output
    config.output
      .set('path', api.resolve(options.outputDir))
      .set('filename', 'app.js')
      .set('libraryTarget', 'commonjs')

    // Resolve
    config.resolve
      .extensions
        .merge(['.mjs', '.js', '.json'])
      .end()
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))
      .end()
      .alias
        .set('@', api.resolve(options.srcDir))
      .end()

    // Loader resolve
    config.resolveLoader
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))

    // Plugins
    config
      .plugin('friendly-errors')
        .use(require('friendly-errors-webpack-plugin'))

    // Others
    config.stats('minimal')
  })
}
