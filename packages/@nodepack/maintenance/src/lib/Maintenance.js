const { Migrator, getMigratorPlugins } = require('@nodepack/app-migrator')
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

/** @typedef {(maintenance: Maintenance) => Promise | void} MaintenanceHook */

/**
 * @typedef MaintenanceOptions
 * @prop {string} cwd Working directory
 * @prop {any} cliOptions CLI options if any
 * @prop {MaintenanceHook} before Called before the common maintenance operations
 * @prop {MaintenanceHook} after Called after the common maintenance operations
 */

/**
 * A Maintenance is a special system that should be run on user project
 * on most occasions (for example: project create, plugin add/update/remove...).
 * It will automatically execute maintenance operations like app and env migrations if needed.
 */
class Maintenance {
  /**
   * @param {MaintenanceOptions} options
   */
  constructor (options) {
    this.options = options
    this.preCommitAttempted = false

    // Are one of those vars non-empty?
    this.isTestOrDebug = !!(process.env.NODEPACK_TEST || process.env.NODEPACK_DEBUG)

    this.pkg = readPkg(this.options.cwd)
    this.plugins = getPlugins(this.pkg)

    this.packageManager = (
      this.options.cliOptions.packageManager ||
      loadGlobalOptions().packageManager ||
      getPkgCommand(this.cwd)
    )
  }

  get cwd () {
    return this.options.cwd
  }

  async run () {
    if (this.options.before) {
      await this.options.before(this)
    }

    const { plugins, packageManager } = this
    const { cwd, cliOptions } = this.options

    // Run app migrations
    const migratorPlugins = await getMigratorPlugins(cwd, plugins)
    const migrator = new Migrator(cwd, {
      plugins: migratorPlugins,
    })
    const { migrations } = await migrator.prepare()
    if (migrations.length) {
      await this.shouldCommitState()
      log(`🚀  Migrating app code...`)
      const { migrationCount } = await migrator.migrate()
      log(`📝  ${migrationCount} app migration${migrationCount > 1 ? 's' : ''} applied!`)

      // install additional deps (injected by migrations)
      log(`📦  Installing additional dependencies...`)
      if (!this.isTestOrDebug) {
        await installDeps(cwd, packageManager, cliOptions.registry)
      }
    }

    // TODO Env Migrations

    if (this.options.after) {
      await this.options.after(this)
    }

    migrator.displayNotices()
  }

  /**
   * Should be called each time the project is about to be modified.
   */
  async shouldCommitState () {
    if (this.preCommitAttempted) return
    // Commit app code before installing a new plugin
    // in case it modify files
    const shouldCommitState = await shouldUseGit(this.options.cwd, this.options.cliOptions)
    if (shouldCommitState) {
      const result = await commitOnGit(this.options.cliOptions, this.isTestOrDebug)
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
}

module.exports = Maintenance
