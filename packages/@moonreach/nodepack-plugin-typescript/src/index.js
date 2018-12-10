/** @type {import('@moonreach/nodepack').ServicePlugin} */
module.exports = (api, options) => {
  const path = require('path')
  const fs = require('fs')
  const useThreads = process.env.NODE_ENV === 'production' && options.parallel

  // Default entry
  try {
    // eslint-disable-next-line node/no-extraneous-require
    const DefaultEntry = require('@moonreach/nodepack/src/util/defaultEntry')
    DefaultEntry.config.defaultEntry = 'index.ts'
  } catch (e) {
    console.error(e)
  }

  api.chainWebpack(config => {
    config.resolveLoader.modules.prepend(path.join(__dirname, 'node_modules'))

    config.resolve
      .extensions
        .merge(['.ts'])

    const tsRule = config.module.rule('ts').test(/\.ts$/)

    // add a loader to both *.ts & vue<lang="ts">
    const addLoader = ({ loader, options = {}}) => {
      tsRule.use(loader).loader(loader).options(options)
    }

    addLoader({
      loader: 'cache-loader',
      options: api.genCacheConfig('ts-loader', {
        'ts-loader': require('ts-loader/package.json').version,
        'typescript': require('typescript/package.json').version,
        modern: !!process.env.VUE_CLI_MODERN_BUILD,
      }, 'tsconfig.json'),
    })

    if (useThreads) {
      addLoader({
        loader: 'thread-loader',
      })
    }

    if (api.hasPlugin('babel')) {
      addLoader({
        loader: 'babel-loader',
      })
    }
    addLoader({
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        appendTsSuffixTo: ['\\.vue$'],
        // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
        happyPackMode: useThreads,
      },
    })

    if (!process.env.NODEPACK_TEST) {
      // this plugin does not play well with jest + cypress setup (tsPluginE2e.spec.js) somehow
      // so temporarily disabled for vue-cli tests
      config
        .plugin('fork-ts-checker')
          .use(require('fork-ts-checker-webpack-plugin'), [{
            tslint: options.lintOnBuild !== false && fs.existsSync(api.resolve('tslint.json')),
            formatter: 'codeframe',
            // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
            checkSyntacticErrors: useThreads,
          }])
    }
  })

  if (!api.hasPlugin('eslint')) {
    api.registerCommand('lint', {
      description: 'lint source files with TSLint',
      usage: 'vue-cli-service lint [options] [...files]',
      options: {
        '--format [formatter]': 'specify formatter (default: codeFrame)',
        '--no-fix': 'do not fix errors',
        '--formatters-dir [dir]': 'formatter directory',
        '--rules-dir [dir]': 'rules directory',
      },
    }, args => {
      return require('./lib/tslint')(args, api)
    })
  }
}
