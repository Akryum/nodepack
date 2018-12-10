/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  api.registerCommand('dev', {
    description: 'Build and live-reload the app',
    usage: 'nodepack dev [entry]',
    options: {
      '-p, --port [port]': 'Specify a default port for process.env.PORT (it may automatically change if not available)',
    },
  }, async (args) => {
    const path = require('path')
    const { info, error, chalk } = require('@moonreach/nodepack-utils')

    info(chalk.blue('Preparing development pack...'))

    // Entry
    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const moreEnv = {}

    // Default port
    if (!process.env.PORT || args.port) {
      const { getDefaultPort } = require('../util/defaultPort')
      const port = await getDefaultPort(api, options, args)
      moreEnv.PORT = port
      if (api.service.env === 'development') {
        info(chalk.blue(`\`process.env.PORT\` has been set to ${port}`))
      }
    }

    // Build
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
          // Kill previous process
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

            // Built entry file
            const file = api.resolve(path.join(webpackConfig.output.path, 'app.js'))

            // Spawn child process
            child = execa('node', [
              file,
            ], {
              stdio: ['inherit', 'inherit', 'inherit'],
              cwd: api.getCwd(),
              cleanup: true,
              shell: false,
              env: moreEnv,
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
