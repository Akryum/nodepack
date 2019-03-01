const commonCommandOptions = require('../util/commonCommandOptions')

const defaultArgs = {
  clean: true,
}

/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  api.registerCommand('build', {
    description: 'Build the app for production',
    usage: 'nodepack-service build [entry]',
    options: {
      '--no-clean': 'do not delete the dist folder before building',
      '--externals': `do not bundle the dependencies into the final built files`,
      '--minify': 'minify the built files',
      '--watch': 'watch source files and automatically re-build',
      ...commonCommandOptions,
    },
  }, async (args) => {
    // Default args
    for (const key in defaultArgs) {
      if (args[key] == null) {
        args[key] = defaultArgs[key]
      }
    }

    const { info, error, done, log, chalk } = require('@nodepack/utils')

    info(chalk.blue('Preparing production pack...'))

    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const webpack = require('webpack')
    const path = require('path')
    const fs = require('fs-extra')
    const formatStats = require('../util/formatStats')

    if (args.externals) {
      options.externals = true
    }

    if (args.minify) {
      options.minify = true
    }

    const webpackConfig = await api.resolveWebpackConfig()
    const targetDir = webpackConfig.output.path

    if (args.clean) {
      await fs.remove(targetDir)
    }

    return new Promise((resolve, reject) => {
      const onError = (err) => {
        if (args.watch) {
          error(err)
        } else {
          reject(err)
        }
      }

      const callback = (err, stats) => {
        if (err) {
          onError(err)
        } else {
          if (stats.hasErrors()) {
            return onError(`Build failed with errors.`)
          }

          const targetDirShort = path.relative(
            api.service.cwd,
            targetDir
          )
          log(formatStats(stats, targetDirShort, api))

          done(chalk.green('Build complete! Your app is ready for production.'))
          if (args.watch) {
            info(chalk.blue(`Watching for file changes...`))
          }
          resolve()
        }
      }

      const compiler = webpack(webpackConfig)
      if (args.watch) {
        compiler.watch(webpackConfig.watchOptions, callback)
      } else {
        compiler.run(callback)
      }
    })
  })
}

// @ts-ignore
module.exports.defaultEnvs = {
  build: 'production',
}
