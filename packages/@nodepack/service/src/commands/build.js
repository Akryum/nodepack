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

    if (args.watch) {
      api.service.isWatching = true
    }

    const chalk = require('chalk')
    const consola = require('consola')
    const compilerInstance = require('../util/compilerInstance')
    const nodeFileTrace = require('@zeit/node-file-trace')
    const findWorkspaceRoot = require('find-workspace-root').default

    process.env.NODEPACK_IS_BUILD = 'true'

    if (args.autoNodeEnv && process.env.NODE_ENV !== 'production') {
      if (!process.env.ORIGINAL_NODE_ENV) {
        consola.warn(chalk.yellow(`NODE_ENV environment variable was not defined, automatically setting to 'production'`))
        process.env.NODE_ENV = 'production'
      } else {
        consola.warn(chalk.yellow(`NODE_ENV environment variable is not set to 'production'`))
      }
    }

    if (!args.silent) {
      consola.info(chalk.blue('Building project...'))
    }

    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const webpack = require('webpack')
    const path = require('path')
    const fs = require('fs-extra')
    const formatStats = require('../util/formatStats')
    const { updateConfig } = require('../util/updateConfig')

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
          consola.error(`Build error:`, err.stack || err)
        } else {
          reject(err)
        }
      }

      const callback = async (err, stats) => {
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
            targetDir,
          )

          // Include tree-shaken dependencies
          if (options.generateStandalone) {
            const standaloneDir = 'standalone'
            const workspaceRoot = await findWorkspaceRoot()
            const json = stats.toJson({
              hash: false,
              modules: false,
              chunks: false,
            })
            let assets = json.assets
              ? json.assets
              : json.children.reduce((acc, child) => acc.concat(child.assets), [])
            assets = assets.filter(a => /\.js$/.test(a.name))
            const jsAssetFiles = assets.map(a => path.resolve(targetDir, a.name))
            // @ts-ignore
            const { fileList } = await nodeFileTrace(jsAssetFiles, {
              base: workspaceRoot || process.cwd(),
              ts: true,
              mixedModules: true,
            })
            const relativeDir = path.relative(workspaceRoot, targetDir)
            const promises = []
            for (const file of fileList) {
              const targetFile = path.join(targetDir, standaloneDir, file)
              fs.ensureDirSync(path.dirname(targetFile))
              promises.push(fs.copyFile(path.resolve(workspaceRoot, file), targetFile))
            }
            await Promise.all(promises)

            // Write entry
            await fs.writeFile(path.resolve(targetDir, standaloneDir, 'index.js'), `module.exports = require('./${path.join(relativeDir)}/app.js');`)

            consola.success(chalk.blue(`Generated ${targetDirShort}/${standaloneDir} with ${fileList.length} tree-shaken dependencies!\nYou can now use the ${targetDirShort}/${standaloneDir} folder outside of your project. In that case, use index.js to run the application standalone-style!\n`))
          }

          if (!args.silent) {
            consola.log(formatStats(stats, targetDirShort, api))

            consola.success(chalk.green('Build complete!'))
            if (args.watch) {
              consola.info(chalk.blue(`Watching for file changes...`))
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
