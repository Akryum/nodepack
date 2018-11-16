/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  api.registerCommand('dev', {
    description: 'Build and live-reload the app',
    usage: 'nodepack dev [entry]',
  }, async (args) => {
    const path = require('path')
    const { info, error, chalk } = require('@moonreach/nodepack-utils')

    info(chalk.blue('Preparing development pack...'))

    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const webpack = require('webpack')
    const webpackConfig = await api.resolveWebpackConfig()
    const execa = require('execa')

    let child

    const compiler = webpack(webpackConfig)

    // Implement pause to webpack compiler
    // For example, this is useful for error diagnostics
    injectPause(compiler)

    compiler.watch(
      webpackConfig.watchOptions,
      (err, stats) => {
        if (err) {
          error(err)
        } else {
          if (child) {
            child.kill()
          }

          if (stats.hasErrors()) {
            error(`Build failed with errors.`)
          } else {
            if (child) {
              info(chalk.blue('App restarting...'))
            } else {
              info(chalk.blue('App starting...'))
            }

            const file = api.resolve(path.join(webpackConfig.output.path, 'app.js'))

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
      }
    )
  })
}

function injectPause (compiler) {
  compiler.$_pause = false
  const compile = compiler.compile
  compiler.compile = (...args) => {
    if (compiler.$_pause) return
    return compile.call(compiler, ...args)
  }
}

// @ts-ignore
module.exports.defaultModes = {
  inspect: 'development',
}
