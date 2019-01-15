/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  const path = require('path')
  const fs = require('fs')
  const useThreads = process.env.NODE_ENV === 'production' && options.parallel

  let nodepackPath
  try {
    nodepackPath = path.dirname(require.resolve('@nodepack/nodepack'))
  } catch (e) {}

  api.chainWebpack(webpackConfig => {
    const babelRcPath = path.resolve('babel.config.js')
    const hasBabelRc = fs.existsSync(babelRcPath)
    const babelOptions = {
      babelrc: true,
      cacheDirectory: true,
      /** @type {string []} */
      presets: [],
    }

    if (hasBabelRc) {
      console.log('> Using babel.config.js defined in your app root')
    } else {
      babelOptions.presets.push('@nodepack/nodepack')
    }

    webpackConfig.resolveLoader.modules.prepend(path.join(__dirname, 'node_modules'))

    const jsRule = webpackConfig.module
      .rule('js')
        .test(/\.jsx?$/)
        .exclude
          .add(filepath => {
            // exclude dynamic entries from nodepack
            if (nodepackPath && filepath.startsWith(nodepackPath)) {
              return true
            }
            // check if this is something the user explicitly wants to transpile
            if (options.transpileDependencies && options.transpileDependencies.some(dep => {
              if (typeof dep === 'string') {
                return filepath.includes(path.normalize(dep))
              } else {
                return !!filepath.match(dep)
              }
            })) {
              return false
            }
            // Don't transpile node_modules
            return /node_modules/.test(filepath)
          })
          .end()
        .use('cache-loader')
          .loader('cache-loader')
          .options(api.genCacheConfig('babel-loader', {
            '@babel/core': require('@babel/core/package.json').version,
            '@nodepack/babel-preset-nodepack': require('@nodepack/babel-preset-nodepack/package.json').version,
            'babel-loader': require('babel-loader/package.json').version,
          }, [
            'babel.config.js',
          ]))
          .end()

    if (useThreads) {
      jsRule
        .use('thread-loader')
          .loader('thread-loader')
    }

    jsRule
      .use('babel-loader')
        .loader('babel-loader')
        .options(babelOptions)
  })
}
