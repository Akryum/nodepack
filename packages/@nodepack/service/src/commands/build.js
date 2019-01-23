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
      '--no-minify': 'do not minify the built files',
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

    if (args.minify === false) {
      options.minify = false
    }

    const webpackConfig = await api.resolveWebpackConfig()
    const targetDir = webpackConfig.output.path

    if (args.clean) {
      await fs.remove(targetDir)
    }

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

            const targetDirShort = path.relative(
              api.service.cwd,
              targetDir
            )
            log(formatStats(stats, targetDirShort, api))

            done(chalk.green('Build complete! Your app is ready for production.'))
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
