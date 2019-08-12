/** @typedef {import('./ServicePlugin.js')} ServicePlugin */
/** @typedef {import('./options.js').ProjectOptions} ProjectOptions */
/** @typedef {import('webpack').Compiler} Compiler */
/** @typedef {import('webpack').Stats} Stats */
/** @typedef {import('webpack-chain')} Config */
/** @typedef {(config: Config) => void} WebpackChainFns */
/**
 * @typedef CommandOptions
 * @prop {string} [description]
 * @prop {string} [usage]
 * @prop {Object.<string, string>} [options]
 * @prop {string} [details]
 */
/**
 * @typedef {(args: Object.<string, any>, rawArgs: string []) => (Promise | void)} CommandFn
 */
/**
 * @typedef Command
 * @prop {CommandFn} fn
 * @prop {CommandOptions?} [opts]
 */
/**
 * @typedef Suggestion
 * @prop {string} id
 * @prop {string} title
 * @prop {string} [description]
 * @prop {string} [link]
 * @prop {string} question
 */
/**
 * @typedef ErrorDiagnoser
 * @prop {(err: any) => boolean} filter
 * @prop {Suggestion | ((err: any) => Suggestion | void | false | Promise.<Suggestion | void | false>)} [suggestion]
 * @prop {(compiler: Compiler, stats: Stats, err: any) => Promise | void} handler
 */

const path = require('path')
const fs = require('fs-extra')
const Config = require('webpack-chain')
const cosmiconfig = require('cosmiconfig')
const defaultsDeep = require('lodash.defaultsdeep')
const ServicePlugin = require('./ServicePlugin')
const ServicePluginAPI = require('./ServicePluginAPI')
const { log, info, warn, error, chalk, readPkg, getPlugins } = require('@nodepack/utils')
const { loadModule } = require('@nodepack/module')
const { defaultOptions } = require('./options')

module.exports = class Service {
  /**
   * @param {string} cwd
   */
  constructor (cwd) {
    this.initialized = false
    this.cwd = cwd

    this.pkg = readPkg(cwd)

    /** @type {ServicePlugin []} */
    this.plugins = this.resolvePlugins()

    /** @type {WebpackChainFns []} */
    this.webpackChainFns = []

    /** @type {Object.<string, Command>} */
    this.commands = {}

    /** @type {Object.<string, string>} */
    this.defaultEnvs = this.resolveDefaultEnvs()

    /** @type {ErrorDiagnoser []} */
    this.errorDiagnosers = []
  }

  resolvePlugins () {
    const idToPlugin = (id, builtin = false) => (new ServicePlugin(
      id.replace(/^..\//, 'built-in:'),
      builtin ? require(id) : loadModule(id, this.cwd)
    ))

    const builtInPlugins = [
      '../commands/dev',
      '../commands/build',
      '../commands/inspect',
      '../commands/help',
      // config plugins are order sensitive
      '../config/base',
      '../config/dev',
      '../config/prod',
    ].map(id => idToPlugin(id, true))

    const projectPlugins = getPlugins(this.pkg)
      .map(id => {
        if (
          this.pkg.optionalDependencies &&
          id in this.pkg.optionalDependencies
        ) {
          let apply = () => {}
          try {
            apply = loadModule(id, this.cwd)
          } catch (e) {
            warn(`Optional dependency ${id} is not installed.`)
          }

          return new ServicePlugin(id, apply)
        } else {
          return idToPlugin(id)
        }
      })

    const plugins = builtInPlugins.concat(projectPlugins)

    return plugins
  }

  resolveDefaultEnvs () {
    return this.plugins.reduce((
      envs,
      // @ts-ignore
      { apply: { defaultEnvs }}
    ) => {
      return Object.assign(envs, defaultEnvs)
    }, {})
  }

  /**
   * @param {string} env
   */
  async init (env) {
    if (this.initialized) return

    this.env = env

    if (process.env.NODE_ENV) {
      process.env.ORIGINAL_NODE_ENV = process.env.NODE_ENV
    } else {
      delete process.env.ORIGINAL_NODE_ENV
    }

    if (env) {
      this.loadEnv(env)
    }
    this.loadEnv()

    process.env.NODEPACK_ENV = env

    info(`⚙️  Env mode is ${chalk.bold(chalk.blue(process.env.NODEPACK_ENV))}`)

    this.projectOptions = this.loadConfig()

    await this.applyPlugins()

    // apply webpack configs from project config file
    if (this.projectOptions.chainWebpack) {
      this.webpackChainFns.push(this.projectOptions.chainWebpack)
    }

    this.initialized = true
  }

  /**
   * @private
   */
  async applyPlugins () {
    // apply plugins
    for (const { id, apply } of this.plugins) {
      await apply(new ServicePluginAPI(id, this), this.projectOptions || {})
    }
  }

  /**
   * @private
   */
  loadEnv (env) {
    const dotenv = require('dotenv')

    const basePath = path.resolve(this.cwd, `.env${env ? `.${env}` : ``}`)
    const localPath = `${basePath}.local`

    const load = filePath => {
      if (fs.existsSync(filePath)) {
        try {
          const vars = dotenv.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
          for (var k in vars) {
            if (process.env.OVERRIDE_ENV || typeof process.env[k] === 'undefined') {
              process.env[k] = vars[k]
            }
          }
        } catch (e) {
          error(e)
        }
      }
    }

    load(localPath)
    load(basePath)

    // by default, NODE_ENV and BABEL_ENV are set to "development" unless env
    // is production or test. However the value in .env files will take higher
    // priority.
    if (env) {
      // always set NODE_ENV during tests
      // as that is necessary for tests to not be affected by each other
      const shouldForceDefaultEnv = (
        process.env.NODEPACK_TEST &&
        !process.env.NODEPACK_TEST_TESTING_ENV
      )
      const defaultNodeEnv = (env === 'production' || env === 'test')
        ? env
        : 'development'
      if (shouldForceDefaultEnv || process.env.NODE_ENV == null) {
        process.env.NODE_ENV = defaultNodeEnv
      }
      if (shouldForceDefaultEnv || process.env.BABEL_ENV == null) {
        process.env.BABEL_ENV = defaultNodeEnv
      }
    }
  }

  /**
   * @private
   * @returns {ProjectOptions}
   */
  loadConfig () {
    /** @type {ProjectOptions} */
    let options
    const explorer = cosmiconfig('nodepack')
    const result = explorer.searchSync(this.cwd)
    if (!result || result.isEmpty) {
      options = defaultOptions()
    } else {
      options = defaultsDeep(result.config, defaultOptions())
    }

    // Dev overrides
    if (process.env.NODE_ENV === 'development') {
      if (!options.externals) {
        options.externals = true
      }
    }

    return options
  }

  async run (name, args = {}, rawArgv = []) {
    // resolve env
    // prioritize inline --env
    // fallback to resolved default envs from plugins or development
    const env = args.env || this.defaultEnvs[name] || 'development'

    // load env variables, load user config, apply plugins
    await this.init(env)

    args._ = args._ || []
    let command = this.commands[name]
    if (!command && name) {
      error(`command "${name}" does not exist.`)
      process.exit(1)
    }
    if (!command || args.help) {
      command = this.commands.help
    } else {
      args._.shift() // remove command itself
      rawArgv.shift()
    }

    if (!['dev', 'build', 'inspect', 'help'].includes(name)) {
      await this.buildEntry('config', {
        env,
        silent: true,
        autoNodeEnv: false,
      }, rawArgv)
    }

    log()

    const { fn } = command
    return fn(args, rawArgv)
  }

  async resolveChainableWebpackConfig () {
    const chainableConfig = new Config()
    // apply chains
    for (const fn of this.webpackChainFns) {
      await fn(chainableConfig)
    }
    return chainableConfig
  }

  async resolveWebpackConfig (chainableConfig = null) {
    if (chainableConfig === null) {
      chainableConfig = await this.resolveChainableWebpackConfig()
    }
    if (!this.initialized) {
      throw new Error('Service must call init() before calling resolveWebpackConfig().')
    }
    // get raw config
    return chainableConfig.toConfig()
  }

  async buildEntry (entryName, args, rawArgv) {
    info(`🔧️  Building ${entryName}...`)
    process.env.NODEPACK_ENTRIES = entryName
    await this.commands.build.fn(args, rawArgv)
    delete process.env.NODEPACK_ENTRIES
  }
}
