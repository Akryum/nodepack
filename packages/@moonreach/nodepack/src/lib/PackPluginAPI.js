/** @typedef {import('./PackService.js')} PackService */
/** @typedef {import('webpack-chain')} Config */
/** @typedef {import('./PackService.js').CommandOptions} CommandOptions */
/** @typedef {import('./PackService.js').CommandFn} CommandFn */

const path = require('path')
const { matchesPluginId } = require('@moonreach/nodepack-utils')

module.exports = class PackPluginAPI {
  /**
   * @param {string} id - Id of the plugin.
   * @param {PackService} service
   */
  constructor (id, service) {
    this.id = id
    this.service = service
  }

  /**
   * Current working directory.
   */
  getCwd () {
    return this.service.cwd
  }

  /**
   * Resolve path for a project.
   *
   * @param {string} filePath - Relative path from project root
   * @return {string} The resolved absolute path.
   */
  resolve (filePath) {
    return path.resolve(this.getCwd(), filePath)
  }

  /**
   * Check if the project has a given plugin.
   *
   * @param {string} id - Plugin id, can omit the (@vue/|vue-|@scope/vue)-cli-plugin- prefix
   * @return {boolean}
   */
  hasPlugin (id) {
    return this.service.plugins.some(p => matchesPluginId(id, p.id))
  }

  /**
   * Register a function that will receive a chainable webpack config
   * the function is lazy and won't be called until `resolveWebpackConfig` is
   * called
   *
   * @param {(config: Config) => void} fn
   */
  chainWebpack (fn) {
    this.service.webpackChainFns.push(fn)
  }

  /**
   * Resolve the final raw webpack config, that will be passed to webpack.
   *
   * @param {Config} [chainableConfig]
   * @return Raw webpack config.
   */
  async resolveWebpackConfig (chainableConfig) {
    return this.service.resolveWebpackConfig(chainableConfig)
  }

  /**
   * Resolve an intermediate chainable webpack config instance, which can be
   * further tweaked before generating the final raw webpack config.
   * You can call this multiple times to generate different branches of the
   * base webpack config.
   * See https://github.com/mozilla-neutrino/webpack-chain
   *
   * @return {Promise.<Config>}
   */
  async resolveChainableWebpackConfig () {
    return this.service.resolveChainableWebpackConfig()
  }

  /**
   * Register a command that will become available as `vue-cli-service [name]`.
   *
   * @param {string} name
   * @param {CommandOptions} [opts]
   * @param {CommandFn} fn
   */
  registerCommand (name, opts, fn) {
    if (typeof opts === 'function') {
      fn = opts
      opts = null
    }
    this.service.commands[name] = { fn, opts: opts }
  }
}
