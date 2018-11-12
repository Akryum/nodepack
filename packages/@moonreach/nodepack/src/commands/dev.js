/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

const path = require('path')
const { info, error, chalk } = require('@moonreach/nodepack-utils')

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  api.registerCommand('dev', {
    description: 'Build and live-reload the app',
    usage: 'nodepack dev [entry]',
  }, async (args) => {
    info(chalk.blue('Preparing development pack...'))

    if (args._ && typeof args._[0] === 'string') {
      options.entry = args._[0]
    } else if (!options.entry) {
      const { getDefaultEntry } = require('../util/defaultEntry.js')
      options.entry = getDefaultEntry(api.getCwd())
    }

    const webpack = require('webpack')
    const webpackConfig = api.resolveWebpackConfig()
    const execa = require('execa')

    /** @type {execa.ExecaChildProcess} */
    let child

    return new Promise((resolve, reject) => {
      const compiler = webpack(webpackConfig)
      compiler.watch(
        webpackConfig.watchOptions,
        (err, stats) => {
          if (err) {
            error(err)
          } else {
            if (stats.hasErrors()) {
              return reject(`Build failed with errors.`)
            }

            if (child) {
              child.kill()
              info(chalk.blue('App restarting...'))
            } else {
              info(chalk.blue('App starting...'))
            }

            const file = api.resolve(path.join(webpackConfig.output.path, webpackConfig.output.filename))

            child = execa('node', [
              file,
            ], {
              stdio: ['inherit', 'inherit', 'inherit'],
              cwd: api.getCwd(),
              cleanup: true,
              shell: false,
            })

            child.on('error', err => {
              error(err)
            })
          }
        }
      )
    })
  })
}
