const path = require('path')
const fs = require('fs-extra')

/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  const resolveLocal = require('../util/resolveLocal')
  const { SUPPORTED_EXTENSIONS } = require('../const')

  api.chainWebpack(config => {
    // Basics
    config
      .target('node')
      .context(api.getCwd())

    fs.ensureDirSync(api.resolve('config'))

    // Fragments
    const fragments = {
      config: path.resolve(__dirname, '../runtime/fragments/config.js'),
      context: path.resolve(__dirname, '../runtime/fragments/context.js'),
      runtime: null,
    }

    // App entries
    const appEntries = {}
    if (options.entries) {
      for (const key in options.entries) {
        appEntries[key] = api.resolve(options.entries[key])
      }
    } else {
      appEntries.app = api.resolve(options.entry || 'index.js')
    }

    // Entry
    const entries = {
      ...fragments,
      ...appEntries,
    }
    let includedEntries = null
    if (process.env.NODEPACK_ENTRIES) {
      includedEntries = process.env.NODEPACK_ENTRIES.replace(/\s/g, '').split(',')
    }
    for (const key in entries) {
      if (!includedEntries || includedEntries.includes(key)) {
        const entry = config.entry(key)

        // Augment entries
        if (options.productionSourceMap || process.env.NODE_ENV !== 'production') {
          entry.add(path.resolve(__dirname, '../runtime/sourcemap.js'))
        }
        entry.add(path.resolve(__dirname, '../runtime/paths.js'))

        // Fragments handling
        if (key === 'runtime') {
          for (const runtimeModule of api.service.runtimeModules) {
            entry.add(runtimeModule)
          }
        } else if (key !== 'config') {
          entry.add(path.resolve(__dirname, '../runtime/load-runtime.js'))
        }

        // Entry
        if (entries[key]) {
          entry.add(entries[key])
        }
      }
    }

    // Disable node polyfills
    config.set('node', false)

    // Output
    const outputPath = process.env.NODEPACK_DIRNAME = api.resolve(
      process.env.NODEPACK_OUTPUT || options.outputDir || 'dist'
    )
    config.output
      .set('path', outputPath)
      .set('filename', '[name].js')
      .set('libraryTarget', 'commonjs2')
      .set('globalObject', 'this')

    // Resolve
    config.resolve
      .extensions.clear()
        .merge(SUPPORTED_EXTENSIONS)
      .end()
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))
      .end()
      .alias
        .set('@config', api.resolve('config'))
        .set('@', api.resolve(options.srcDir || 'src'))
      .end()
      // webpack defaults to `module` and `main`, but that's
      // not really what node.js supports, so we reset it
      .mainFields.clear()
        .add('main')
      .end()

    // Loader resolve
    config.resolveLoader
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))

    // Rules

    config.module
      .rule('js-assets')
      .test(/\.(js|mjs|tsx?|node)$/)
      .parser({ amd: false })
      .use('asset-relocator')
        .loader('@zeit/webpack-asset-relocator-loader')
        .options({
          // optional, base folder for asset emission (eg assets/name.ext)
          outputAssetBase: 'assets',
          // optional, a list of asset names already emitted or
          // defined that should not be emitted
          existingAssetNames: [],
          wrapperCompatibility: true, // optional, default
          escapeNonAnalyzableRequires: true, // optional, default
        })

    // See https://github.com/graphql/graphql-js/issues/1272
    config.module
      .rule('mjs$')
      .test(/\.mjs$/)
      .include
        .add(/node_modules/)
        .end()
      // @ts-ignore
      .type('javascript/auto')

    // Module
    config.module
      .set('exprContextCritical', options.externals)
      // Allow usage of native require (instead of webpack require)
      .set('noParse', /\/native-require.js$/)

    // External modules (default are modules in package.json deps)
    if (options.externals === true) {
      const nodeExternals = require('webpack-node-externals')
      const findUp = require('find-up')
      const externalsConfig = {
        whitelist: options.nodeExternalsWhitelist || [
          /\.(eot|woff|woff2|ttf|otf)$/,
          /\.(svg|png|jpg|jpeg|gif|ico|webm)$/,
          /\.(mp4|mp3|ogg|swf|webp)$/,
          /\.(css|scss|sass|less|styl)$/,
        ],
      }
      const externals = [
        // Read from package.json
        nodeExternals({
          ...externalsConfig,
          modulesFromFile: true,
        }),
      ]
      let cwd = api.getCwd()
      let folder
      // Find all node_modules folders (to support monorepos)
      do {
        folder = findUp.sync('node_modules', {
          cwd,
          type: 'directory',
        })
        if (folder) {
          externals.push(nodeExternals({
            ...externalsConfig,
            modulesDir: folder,
          }))
          cwd = path.resolve(folder, '../..')
        }
      } while (folder)
      config.externals(externals)
    } else {
      let optionsExternals = options.externals || []
      if (typeof optionsExternals === 'function') {
        throw new Error('externals function is not supported')
      }
      if (!Array.isArray(optionsExternals)) {
        optionsExternals = [optionsExternals]
      }
      const externals = require('../util/externals')(api, optionsExternals)
      config.externals([externals.checkExternals])
    }

    // Plugins
    const resolveClientEnv = require('../util/resolveClientEnv')
    config
      .plugin('define')
        // @ts-ignore
        .use(require('webpack/lib/DefinePlugin'), [
          resolveClientEnv(options),
        ])

    // Others
    config.stats('minimal')
    config.performance.set('hints', false)
    config.optimization.nodeEnv(false)
    config.optimization.concatenateModules(false)
    config.optimization.splitChunks({
      chunks: 'all',
      maxInitialRequests: 2,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    })
  })
}
