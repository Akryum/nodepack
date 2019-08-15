/** @typedef {import('../lib/ServicePluginAPI')} ServicePluginAPI */

/**
 * @param {ServicePluginAPI} api
 * @param {any[]} externals
 */
module.exports = function (api, externals) {
  const compilerInstance = require('./compilerInstance')
  const { NODE_BUILTINS } = require('../const')
  const { warn, pkgNameRegEx } = require('@nodepack/utils')
  const { sep } = require('path')

  /** @type {import('webpack').Configuration?} */
  let resolvedConfig = null

  /** @type {Set<string>} */
  const externalSet = new Set(externals.filter(e => typeof e === 'string'))
  /** @type {RegExp[]} */
  const regExps = externals.filter(e => e instanceof RegExp)

  const matchRegExp = request => regExps.some(reg => reg.test(request))

  const checkExternals = async (context, request, callback) => {
    if (!compilerInstance.compiler) {
      throw new Error('No compiler instance available')
    }

    if (!resolvedConfig) {
      resolvedConfig = await api.resolveWebpackConfig()
    }

    // Webpack alias
    if (resolvedConfig && resolvedConfig.resolve && resolvedConfig.resolve.alias) {
      for (const key in resolvedConfig.resolve.alias) {
        request = request.replace(new RegExp(key), resolvedConfig.resolve.alias[key])
      }
    }

    // User-defined externals
    if (externalSet.has(request) || matchRegExp(request)) {
      return callback(null, `commonjs ${request}`)
    }

    if (request[0] === '.' && (request[1] === '/' || request[1] === '.' && request[2] === '/')) {
      if (request.startsWith('./node_modules/')) {
        request = request.substr(15)
      } else if (request.startsWith('../node_modules/')) {
        request = request.substr(16)
      } else {
        return callback()
      }
    }

    if (request[0] === '/' || /^[a-z]:\\/i.test(request) || NODE_BUILTINS.has(request)) {
      return callback()
    }

    const pkgNameMatch = request.match(pkgNameRegEx)
    if (pkgNameMatch) request = pkgNameMatch[0]
    let pkgPath = context + sep + 'node_modules' + sep + request
    do {
      if (await new Promise((resolve, reject) => {
        if (compilerInstance.compiler) {
          compilerInstance.compiler.inputFileSystem.stat(pkgPath, (err, stats) => {
            // @ts-ignore
            if (err && err.code !== 'ENOENT') {
              reject(err)
            } else {
              resolve(stats ? stats.isDirectory() : false)
            }
          })
        } else {
          reject(new Error('no compiler available'))
        }
      })) { return callback() }
    } while (pkgPath.length > (pkgPath = pkgPath.substr(0, pkgPath.lastIndexOf(sep, pkgPath.length - 15 - request.length)) + sep + 'node_modules' + sep + request).length)

    warn(`Module directory "${context}" attempted to require "${request}" but could not be resolved, assuming external.`)
    return callback(null, `commonjs ${request}`)
  }

  return {
    checkExternals,
  }
}
