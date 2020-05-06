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
const { cosmiconfigSync } = require('cosmiconfig')
const defaultsDeep = require('lodash/defaultsDeep')
const ServicePlugin = require('./ServicePlugin')
const ServicePluginAPI = require('./ServicePluginAPI')
const { getPlugins } = require('@nodepack/plugins-resolution')
const { readPkg } = require('@nodepack/utils')
const chalk = require('chalk')
const consola = require('consola')
const { loadModule } = require('@nodepack/module')
const { runMaintenance } = require('@nodepack/maintenance')
const { defaultOptions } = require('./options')

const NO_MAINTENANCE_COMMANDS = [
  'help',
  'build',
  'inspect',
]

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

    /** @type {string[]} */
    this.runtimeModules = []

    /** @type {string} */
    this.configPath = null

    this.isWatching = false

    // @ts-ignore
    process.NODEPACK_SERVICE = this
  }

  resolvePlugins () {
    const pickDefault = mod => mod.default || mod

    const idToPlugin = (id, builtin = false) => (new ServicePlugin(
      id.replace(/^..\//, 'built-in:'),
      pickDefault(builtin ? require(id) : loadModule(id, this.cwd)),
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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          let apply = () => {}
          try {
            apply = pickDefault(loadModule(id, this.cwd))
          } catch (e) {
            consola.warn(`Optional dependency ${id} is not installed.`)
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
      { apply: { defaultEnvs } },
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

    consola.info(`⚙️  Env mode is ${chalk.bold(chalk.blue(process.env.NODEPACK_ENV))}`)

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
          for (const k in vars) {
            if (process.env.OVERRIDE_ENV || typeof process.env[k] === 'undefined') {
              process.env[k] = vars[k]
            }
          }
        } catch (e) {
          consola.error(`Could not load env for ${filePath}`, e.stack || e)
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
    const explorer = cosmiconfigSync('nodepack')
    const result = explorer.search(this.cwd)
    this.configPath = result.filepath
    if (!result || result.isEmpty) {
      options = defaultOptions()
    } else {
      options = defaultsDeep(result.config, defaultOptions())
    }

    return options
  }

  /**
   * @param {string} name
   */
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
      consola.error(`command "${name}" does not exist.`)
      process.exit(1)
    }
    if (!command || args.help) {
      command = this.commands.help
    } else {
      args._.shift() // remove command itself
      rawArgv.shift()
    }

    this.commandName = name
    this.command = command

    const maintenanceEnabled = !NO_MAINTENANCE_COMMANDS.includes(name) &&
      process.env.NODEPACK_NO_MAINTENANCE !== 'true' &&
      args.maintenance !== false
    if (maintenanceEnabled) {
      await runMaintenance({
        cwd: this.cwd,
        cliOptions: args,
        skipPreInstall: true,
      })
    }

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
}
