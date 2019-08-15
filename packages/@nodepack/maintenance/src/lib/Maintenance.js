/** @typedef {import('@nodepack/utils').Preset} Preset */
/** @typedef {import('@nodepack/app-migrator').MigrationAllOptions} AppMigrationAllOptions */

const { Migrator: AppMigrator, getMigratorPlugins: getAppMigratorPlugins } = require('@nodepack/app-migrator')
const { Migrator: EnvMigrator } = require('@nodepack/env-migrator')
const {
  log,
  error,
  chalk,
  readPkg,
  getPlugins,
  commitOnGit,
  shouldUseGit,
  hasGitChanges,
  installDeps,
  loadGlobalOptions,
  getPkgCommand,
} = require('@nodepack/utils')
const { Hookable } = require('@nodepack/hookable')
const inquirer = require('inquirer')
const execa = require('execa')

const FRAGMENTS = [
  'config',
  'context',
  'runtime',
]

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
    }
    /** @type {function[]} */
    this.completeCbs = []
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

    // Build fragments
    if (!this.skipBuild) {
      await this.buildFragments(FRAGMENTS)
    }

    // Env Migrations
    await this.runEnvMigrations()
    await this.callHook('afterEnvMigrations')

    log(`🔧  Maintenance complete!`)

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
      log(`🚀  Migrating app code...`)
      const { migrationCount, allOptions } = await migrator.up(this.preset)
      log(`📝  ${migrationCount} app migration${migrationCount > 1 ? 's' : ''} applied!`)

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
    const { cwd } = this
    const migrationsFolder = 'migration/env'
    const migrator = new EnvMigrator(cwd, {
      migrationsFolder,
    })
    const { files } = await migrator.prepareUp()
    if (files.length) {
      await this.shouldCommitState(`[nodepack] before env migration`)
      log(`🚀  Migrating env...`)
      const { migrationCount } = await migrator.up()
      log(`💻️  ${migrationCount} env migration${migrationCount > 1 ? 's' : ''} applied!`)
      this.results.envMigrationCount = migrationCount
      // install additional deps (injected by migrations)
      await this.installDeps(`📦  Installing additional dependencies...`)
      await this.shouldCommitState(`[nodepack] after env migration`)
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
        log(chalk.grey(`commit ${message}`), 'git')
      } else {
        error(e.message)
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
      if (message) log(message)
      await installDeps(this.cwd, this.packageManager, this.cliOptions.registry)
    }
  }

  /**
   * Build app fragments
   * @param {string[]} entryNames
   */
  async buildFragments (entryNames) {
    log(`🔨️  Building fragments ${chalk.blue(entryNames.join(', '))}...`)
    await execa('nodepack-service', [
      'build',
      '--silent',
      '--no-autoNodeEnv',
    ], {
      cwd: this.cwd,
      env: {
        NODEPACK_ENTRIES: entryNames.join(','),
        NODEPACK_NO_MAINTENANCE: 'true',
        NODEPACK_OUTPUT: '.nodepack/temp/fragments/',
      },
      stdio: ['inherit', 'inherit', 'inherit'],
    })
  }
}

module.exports = Maintenance
