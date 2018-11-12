/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

const { info, error, done, log, chalk } = require('@moonreach/nodepack-utils')

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  api.registerCommand('build', {
    description: 'Build the app for production',
    usage: 'nodepack build [entry]',
  }, async (args) => {
    info(chalk.blue('Preparing production pack...'))

    if (args._ && typeof args._[0] === 'string') {
      options.entry = args._[0]
    } else if (!options.entry) {
      const { getDefaultEntry } = require('../util/defaultEntry.js')
      options.entry = getDefaultEntry(api.getCwd())
    }

    const webpack = require('webpack')
    const webpackConfig = api.resolveWebpackConfig()

    return new Promise((resolve, reject) => {
      const compiler = webpack(webpackConfig)
      compiler.run(
        (err, stats) => {
          if (err) {
            error(err)
          } else {
            if (stats.hasErrors()) {
              return reject(`Build failed with errors.`)
            }

            done(chalk.green('Build complete! Your app is ready for production.'))
            log(chalk.dim(api.resolve(webpackConfig.output.path)))
            resolve()
          }
        }
      )
    })
  })
}

// @ts-ignore
module.exports.defaultEnvs = {
  build: 'production',
}
