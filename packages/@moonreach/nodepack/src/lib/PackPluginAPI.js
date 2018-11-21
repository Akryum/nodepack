/** @typedef {import('./PackService.js')} PackService */
/** @typedef {import('./PackService.js').CommandOptions} CommandOptions */
/** @typedef {import('./PackService.js').CommandFn} CommandFn */
/** @typedef {import('./PackService.js').ErrorDiagnoser} ErrorDiagnoser */
/** @typedef {import('webpack-chain')} Config */

const path = require('path')
const { matchesPluginId, info, chalk } = require('@moonreach/nodepack-utils')

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
   * Check if the project has a given package installed in either dependencies or devDependencies.
   *
   * @param {string} id - Package id
   * @return {boolean}
   */
  hasPackage (id) {
    const pkg = this.service.pkg
    return ((pkg.dependencies && pkg.dependencies[id]) || (pkg.devDependencies && pkg.devDependencies[id]))
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
   * @param {CommandOptions? | CommandFn} opts
   * @param {CommandFn} [fn]
   */
  registerCommand (name, opts, fn) {
    if (typeof opts === 'function') {
      fn = opts
      opts = null
    }
    // @ts-ignore
    this.service.commands[name] = { fn, opts }
  }

  /**
   * Generate a cache identifier from a number of variables
   *
   * @param {string} id
   * @param {any} partialIdentifier
   * @param {string | string []} configFiles
   */
  genCacheConfig (id, partialIdentifier, configFiles) {
    const hash = require('hash-sum')
    const fs = require('fs')
    const cacheDirectory = this.resolve(`node_modules/.cache/${id}`)

    const variables = {
      partialIdentifier,
      'cli-service': require('../../package.json').version,
      'cache-loader': require('cache-loader/package.json').version,
      env: process.env.NODE_ENV,
      test: !!process.env.VUE_CLI_TEST,
      config: [
        this.service.projectOptions && this.service.projectOptions.chainWebpack,
      ],
    }

    if (configFiles) {
      const readConfig = file => {
        const absolutePath = this.resolve(file)
        if (fs.existsSync(absolutePath)) {
          return fs.readFileSync(absolutePath, 'utf-8')
        }
      }
      if (!Array.isArray(configFiles)) {
        configFiles = [configFiles]
      }
      for (const file of configFiles) {
        const content = readConfig(file)
        if (content) {
          variables.configFiles = content
          break
        }
      }
    }

    const cacheIdentifier = hash(variables)
    return { cacheDirectory, cacheIdentifier }
  }

  /**
   * Register an error diagnosis analyzer
   *
   * @param {ErrorDiagnoser} errorDiagnoser
   */
  diagnoseError (errorDiagnoser) {
    this.service.errorDiagnosers.push(errorDiagnoser)
  }

  /**
   * Request a service restart
   */
  async restart (reason) {
    if (process.env._RESTARTED && process.env._RESTART_REASON === reason) {
      console.log(chalk.dim(`Service restart aborted to avoid infinite loop (reason: ${reason})`))
      return
    }
    info(chalk.blue(`Service restart...`))
    process.send && process.send({ restart: { reason }})
    process.exit(75)
  }
}
