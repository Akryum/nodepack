/** @typedef {import('@nodepack/utils').Preset} Preset */
/** @typedef {import('@nodepack/app-migrator').MigrationAllOptions} AppMigrationAllOptions */

const { Migrator: AppMigrator, getMigratorPlugins: getAppMigratorPlugins } = require('@nodepack/app-migrator')
const { Migrator: EnvMigrator } = require('@nodepack/env-migrator')
const { Migrator: DbMigrator } = require('@nodepack/db-migrator')
const { getPlugins } = require('@nodepack/plugins-resolution')
const {
  readPkg,
  commitOnGit,
  shouldUseGit,
  hasGitChanges,
  installDeps,
  loadGlobalOptions,
  getPkgCommand,
} = require('@nodepack/utils')
const { Hookable } = require('@nodepack/hookable')
const { loadFragment } = require('@nodepack/fragment')
const inquirer = require('inquirer')
const execa = require('execa')
const chalk = require('chalk')
const consola = require('consola')

const FRAGMENTS = [
  'config',
  'context',
  'runtime',
]

const ENV_MIGRATION_FOLDER = 'migration/env'
const DB_MIGRATION_FOLDER = 'migration/db'

/**
 * @typedef MaintenanceHookAPI
 * @prop {string} cwd
 * @prop {boolean} isTestOrDebug
 * @prop {string} packageManager
 * @prop {any} pkg
 * @prop {string[]} plugins
 * @prop {MaintenanceResults} results
 * @prop {typeof Maintenance.prototype.shouldCommitState} shouldCommitState
 * @prop {typeof Maintenance.prototype.installDeps} installDeps
 */

/** @typedef {(api: MaintenanceHookAPI) => Promise | void} MaintenanceHook */

/**
 * @typedef MaintenanceHooks
 * @prop {MaintenanceHook} [before]
 * @prop {MaintenanceHook} [afterAppMigrations]
 * @prop {MaintenanceHook} [afterEnvMigrations]
 * @prop {MaintenanceHook} [after]
 */

/**
 * @typedef MaintenanceOptions
 * @prop {string} cwd Working directory
 * @prop {any} [cliOptions] CLI options if any
 * @prop {Preset?} [preset] Project preset (used for project creation)
 * @prop {boolean} [skipCommit] Don't try to commit with git
 * @prop {boolean} [skipPreInstall] Don't run install package at the begining of the maintenance
 * @prop {boolean} [skipBuild] Don't build app fragments like config
 * @prop {MaintenanceHooks?} [hooks] Hooks
 */

/**
 * @typedef MaintenanceResults
 * @prop {AppMigrationAllOptions?} appMigrationAllOptions
 * @prop {number} appMigrationCount
 * @prop {number} envMigrationCount
 * @prop {number} dbMigrationCount
 */

/**
 * A Maintenance is a special system that should be run on user project
 * on most occasions (for example: project create, plugin add/update/remove...).
 * It will automatically execute maintenance operations like app and env migrations if needed.
 * It also has useful helpers for those occasions to reduce code duplication.
 */
class Maintenance {
  /**
   * @param {MaintenanceOptions} options
   */
  constructor ({
    cwd,
    cliOptions = {},
    preset = null,
    skipCommit = false,
    skipPreInstall = false,
    skipBuild = false,
    hooks = null,
  }) {
    this.cwd = cwd
    this.cliOptions = cliOptions
    this.preset = preset
    this.skipCommit = skipCommit
    this.skipPreInstall = skipPreInstall
    this.skipBuild = skipBuild
    this.hooks = new Hookable()
    if (hooks) this.hooks.addHooks(hooks)

    // Are one of those vars non-empty?
    this.isTestOrDebug = !!(process.env.NODEPACK_TEST || process.env.NODEPACK_DEBUG)

    this.pkg = readPkg(this.cwd)
    this.plugins = getPlugins(this.pkg)

    this.packageManager = (
      this.cliOptions.packageManager ||
      loadGlobalOptions().packageManager ||
      getPkgCommand(this.cwd)
    )

    /** @type {MaintenanceResults} */
    this.results = {
      appMigrationAllOptions: null,
      appMigrationCount: 0,
      envMigrationCount: 0,
      dbMigrationCount: 0,
    }
    /** @type {function[]} */
    this.completeCbs = []

    this.context = null
    this.fragmentsBuilt = false
  }

  async preInstall () {
    await this.installDeps(`📦  Checking dependencies installation...`)
  }

  async run () {
    await this.callHook('before')

    // pre-run install to be sure everything is up-to-date
    if (!this.skipPreInstall) {
      await this.preInstall()
    }

    // App Migrations
    await this.runAppMigrations()
    await this.callHook('afterAppMigrations')

    // Prepare context
    await this.buildFragments(FRAGMENTS)
    await this.createContext()

    // Env Migrations
    await this.runEnvMigrations()
    await this.callHook('afterEnvMigrations')

    // Database Migrations
    await this.runDbMigrations()
    await this.callHook('afterDbMigrations')

    consola.log(`🔧  Maintenance complete!`)

    await this.callHook('after')
    await this.callCompleteCbs()
  }

  async runAppMigrations () {
    const { cwd, plugins } = this
    const migratorPlugins = await getAppMigratorPlugins(cwd, plugins)
    const migrator = new AppMigrator(cwd, {
      plugins: migratorPlugins,
    })
    const { migrations } = await migrator.prepareUp()
    if (migrations.length) {
      await this.shouldCommitState(`[nodepack] before app migration`)
      consola.log(`🚀  Migrating app code...`)
      const { migrationCount, allOptions } = await migrator.up(this.preset)
      consola.log(`📝  ${migrationCount} app migration${migrationCount > 1 ? 's' : ''} applied!`)

      this.results.appMigrationCount = migrationCount
      this.results.appMigrationAllOptions = allOptions

      // install additional deps (injected by migrations)
      await this.installDeps(`📦  Installing additional dependencies...`)
      await this.shouldCommitState(`[nodepack] after app migration`)
    }
    this.completeCbs.push(() => {
      migrator.displayNotices()
    })
  }

  async runEnvMigrations () {
    const { cwd, context } = this
    const migrator = new EnvMigrator(cwd, {
      migrationsFolder: ENV_MIGRATION_FOLDER,
      context,
    })
    const { files } = await migrator.prepareUp()
    if (files.length) {
      await this.shouldCommitState(`[nodepack] before env migration`)
      consola.log(`🚀  Migrating env...`)
      const { migrationCount } = await migrator.up()
      consola.log(`💻️  ${migrationCount} env migration${migrationCount > 1 ? 's' : ''} applied!`)
      this.results.envMigrationCount = migrationCount
      // install additional deps (injected by migrations)
      await this.installDeps(`📦  Installing additional dependencies...`)
      await this.shouldCommitState(`[nodepack] after env migration`)
    }
  }

  async runDbMigrations () {
    const { cwd, context } = this
    if (!context.readDbMigrationRecords) return
    const migrator = new DbMigrator(cwd, {
      migrationsFolder: DB_MIGRATION_FOLDER,
      context,
    })
    const { files } = await migrator.prepareUp()
    if (files.length) {
      await this.shouldCommitState(`[nodepack] before db migration`)
      consola.log(`🚀  Migrating db...`)
      const { migrationCount } = await migrator.up()
      consola.log(`🗄️  ${migrationCount} db migration${migrationCount > 1 ? 's' : ''} applied!`)
      this.results.dbMigrationCount = migrationCount
      await this.shouldCommitState(`[nodepack] after db migration`)
    }
  }

  /**
   * @param {string} id
   */
  async callHook (id) {
    // Hook API
    await this.hooks.callHook(id, {
      cwd: this.cwd,
      isTestOrDebug: this.isTestOrDebug,
      pkg: this.pkg,
      plugins: this.plugins,
      packageManager: this.packageManager,
      results: this.results,
      shouldCommitState: this.shouldCommitState.bind(this),
      installDeps: this.installDeps.bind(this),
    })
  }

  async callCompleteCbs () {
    for (const cb of this.completeCbs) {
      await cb()
    }
  }

  /**
   * Should be called each time the project is about to be modified.
   * @param {string} defaultMessage
   * @param {boolean} force
   */
  async shouldCommitState (defaultMessage, force = false) {
    if (this.skipCommit && !force) return
    // Commit app code before installing a new plugin
    // in case it modify files
    const shouldCommit = await shouldUseGit(this.cwd, this.cliOptions) && await hasGitChanges(this.cwd, false)
    if (shouldCommit) {
      const { success, message, error: e } = await commitOnGit(this.cwd, this.cliOptions, this.isTestOrDebug, defaultMessage)
      if (success) {
        consola.log(chalk.grey(`commit ${message}`), 'git')
      } else {
        consola.error(e.message)
        // Commit failed confirmation
        const answers = await inquirer.prompt([
          {
            name: 'continue',
            type: 'confirm',
            message: `Git commit "${defaultMessage}" failed, the current app code wasn't saved. Continue anyway?`,
            default: false,
          },
        ])
        if (!answers.continue) {
          process.exit()
        }
      }
    }
  }

  /**
   * @param {string?} message
   */
  async installDeps (message = null) {
    if (!this.isTestOrDebug) {
      if (message) consola.log(message)
      await installDeps(this.cwd, this.packageManager, this.cliOptions.registry)
    }
  }

  /**
   * Build app fragments
   * @param {string[]} entryNames
   */
  async buildFragments (entryNames) {
    if (this.fragmentsBuilt || this.skipBuild) return

    consola.log(`🔨️  Building fragments ${chalk.blue(entryNames.join(', '))}...`)

    try {
      const io = process.env.NODEPACK_DEBUG === 'true' ? 'inherit' : 'ignore'
      const result = await execa('nodepack-service', [
        'build',
        '--silent',
        '--no-autoNodeEnv',
        '--no-preInstall',
      ], {
        cwd: this.cwd,
        env: {
          NODEPACK_ENTRIES: entryNames.join(','),
          NODEPACK_NO_MAINTENANCE: 'true',
          NODEPACK_OUTPUT: '.nodepack/temp/fragments/',
          NODEPACK_RAW_STATS: 'true',
          NODEPACK_MAINTENANCE_FRAGMENTS: 'true',
        },
        stdio: [io, io, 'inherit'],
        preferLocal: true,
      })
      this.fragmentsBuilt = true
      if (result.failed) {
        console.log(result.all)
        throw new Error(`Fragment build failed`)
      }
    } catch (e) {
      if (e.failed) {
        console.log(e.all)
      }
      throw e
    }
  }

  async createContext () {
    if (this.context != null) return
    const { createContext } = loadFragment('context', this.cwd)
    this.context = await createContext()
  }
}

module.exports = Maintenance
