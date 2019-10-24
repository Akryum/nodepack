const commonCommandOptions = require('../util/commonCommandOptions')

const defaultArgs = {
  clean: true,
  autoNodeEnv: true,
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
      '--silent': 'suppress information messages',
      '--no-autoNodeEnv': `do not automatically set NODE_ENV to 'production'`,
      ...commonCommandOptions,
    },
  }, async (args) => {
    // Default args
    for (const key in defaultArgs) {
      if (args[key] == null) {
        args[key] = defaultArgs[key]
      }
    }

    const { info, warn, error, done, log, chalk } = require('@nodepack/utils')
    const compilerInstance = require('../util/compilerInstance')

    process.env.NODEPACK_IS_BUILD = 'true'

    if (args.autoNodeEnv && process.env.NODE_ENV !== 'production') {
      if (!process.env.ORIGINAL_NODE_ENV) {
        warn(chalk.yellow(`NODE_ENV environment variable was not defined, automatically setting to 'production'`))
        process.env.NODE_ENV = 'production'
      } else {
        warn(chalk.yellow(`NODE_ENV environment variable is not set to 'production'`))
      }
    }

    if (!args.silent) {
      info(chalk.blue('Building project...'))
    }

    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const webpack = require('webpack')
    const path = require('path')
    const fs = require('fs-extra')
    const formatStats = require('../util/formatStats')
    const { updateConfig } = require('../util/updateConfig')

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

    await updateConfig(api.getCwd(), {
      output: process.env.NODEPACK_DIRNAME,
    })

    return new Promise((resolve, reject) => {
      const onError = (err) => {
        if (args.watch) {
          error(err)
        } else {
          reject(err)
        }
      }

      const callback = (err, stats) => {
        if (process.env.NODEPACK_RAW_STATS) {
          console.log(stats.toString({
            colors: true,
          }))
        }

        if (err) {
          onError(err)
        } else {
          if (stats.hasErrors()) {
            const data = stats.toJson()
            for (const error of data.errors) {
              console.log('\n', error.stack || error.message || error)
            }
            onError(`Build failed with errors.`)
            return
          }

          const targetDirShort = path.relative(
            api.service.cwd,
            targetDir
          )

          if (!args.silent) {
            log(formatStats(stats, targetDirShort, api))

            done(chalk.green('Build complete!'))
            if (args.watch) {
              info(chalk.blue(`Watching for file changes...`))
            }
          }

          resolve()
        }
      }

      const compiler = webpack(webpackConfig)
      compilerInstance.compiler = compiler
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
