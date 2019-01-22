/** @typedef {import('@nodepack/utils').Preset} Preset */
/** @typedef {import('@nodepack/app-migrator').MigrationAllOptions} AppMigrationAllOptions */

const { Migrator: AppMigrator, getMigratorPlugins: getAppMigratorPlugins } = require('@nodepack/app-migrator')
const {
  log,
  readPkg,
  getPlugins,
  commitOnGit,
  shouldUseGit,
  installDeps,
  loadGlobalOptions,
  getPkgCommand,
} = require('@nodepack/utils')
const inquirer = require('inquirer')

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
 * @typedef MaintenanceOptions
 * @prop {string} cwd Working directory
 * @prop {any} [cliOptions] CLI options if any
 * @prop {Preset?} [preset] Project preset (used for project creation)
 * @prop {boolean} [skipCommit] Don't try to commit with git
 * @prop {boolean} [skipPreInstall] Don't run install package at the begining of the maintenance
 * @prop {MaintenanceHook?} [before] Called before the common maintenance operations
 * @prop {MaintenanceHook?} [after] Called after the common maintenance operations
 */

/**
 * @typedef MaintenanceResults
 * @prop {AppMigrationAllOptions?} appMigrationAllOptions
 * @prop {number} appMigrationCount
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
    before = null,
    after = null,
  }) {
    this.cwd = cwd
    this.cliOptions = cliOptions
    this.preset = preset
    this.skipCommit = skipCommit
    this.skipPreInstall = skipPreInstall
    this.hooks = {
      before,
      after,
    }

    this.preCommitAttempted = false

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
    }
  }

  async run () {
    await this.callHook('before')

    const { cwd, plugins } = this

    // pre-run install to be sure everything is up-to-date
    if (!this.skipPreInstall) {
      await this.installDeps(`📦  Checking dependencies installation...`)
    }

    // Run app migrations
    const migratorPlugins = await getAppMigratorPlugins(cwd, plugins)
    const migrator = new AppMigrator(cwd, {
      plugins: migratorPlugins,
    })
    const { migrations } = await migrator.prepareMigrate()
    if (migrations.length) {
      await this.shouldCommitState(`[nodepack] before app migration`)
      log(`🚀  Migrating app code...`)
      const { migrationCount, allOptions } = await migrator.migrate(this.preset)
      log(`📝  ${migrationCount} app migration${migrationCount > 1 ? 's' : ''} applied!`)

      this.results.appMigrationCount = migrationCount
      this.results.appMigrationAllOptions = allOptions

      // install additional deps (injected by migrations)
      await this.installDeps(`📦  Installing additional dependencies...`)
      await this.shouldCommitState(`[nodepack] after app migration`)
    }

    // TODO Env Migrations

    log(`🔧  Maintenance complete!`)

    await this.callHook('after')

    migrator.displayNotices()
  }

  /**
   * @param {string} id
   */
  async callHook (id) {
    /** @type {MaintenanceHook} */
    const hook = this.hooks[id]
    if (hook) {
      // Hook API
      await hook({
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
  }

  /**
   * Should be called each time the project is about to be modified.
   * @param {string} defaultMessage
   */
  async shouldCommitState (defaultMessage) {
    if (this.preCommitAttempted || this.skipCommit) return
    // Commit app code before installing a new plugin
    // in case it modify files
    const shouldCommitState = await shouldUseGit(this.cwd, this.cliOptions)
    if (shouldCommitState) {
      const result = await commitOnGit(this.cliOptions, this.isTestOrDebug, defaultMessage)
      if (!result) {
        // Commit failed confirmation
        const answers = await inquirer.prompt([
          {
            name: 'continue',
            type: 'confirm',
            message: `Git commit failed, the current app code wasn't saved. Continue anyway?`,
            default: false,
          },
        ])
        if (!answers.continue) {
          process.exit()
        }
      }
    }
    this.preCommitAttempted = true
  }

  /**
   * @param {string?} message
   */
  async installDeps (message = null) {
    if (!this.isTestOrDebug) {
      if (message) log(message)
      await installDeps(this.cwd, this.packageManager, this.cliOptions.registry)
    }
  }
}

module.exports = Maintenance
