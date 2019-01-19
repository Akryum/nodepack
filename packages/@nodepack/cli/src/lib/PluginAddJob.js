const { Migrator } = require('@nodepack/app-migrator')
const {
  resolvePluginId,
  readPkg,
  getPlugins,
  log,
  warn,
  error,
  chalk,
  loadGlobalOptions,
  getPkgCommand,
  installPackage,
  getPackageTaggedVersion,
} = require('@nodepack/utils')
const { shouldUseGit, commitOnGit } = require('../util/git')
const getMigratorPlugins = require('../util/getMigratorPlugins')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')
const officialPluginShorthands = require('../util/officialPluginShorthands')

module.exports = class PluginAddJob {
  /**
   * @param {string} pluginName
   * @param {string} cwd
   */
  constructor (pluginName, cwd) {
    if (officialPluginShorthands.includes(pluginName)) {
      pluginName = `@nodepack/plugin-${pluginName}`
    }
    this.packageName = resolvePluginId(pluginName)
    this.cwd = cwd
    this.pkg = readPkg(cwd)

    /** @type {function []} */
    this.createCompleteCbs = []
  }

  /**
   * @param {any} cliOptions Additional options
   */
  async add (cliOptions) {
    const { packageName, cwd, pkg, createCompleteCbs } = this
    // Are one of those vars non-empty?
    const isTestOrDebug = !!(process.env.NODEPACK_TEST || process.env.NODEPACK_DEBUG)

    // Commit app code before installing a new plugin
    // in case it modify files
    const shouldCommitState = await shouldUseGit(cwd, cliOptions)
    if (shouldCommitState) {
      const result = await commitOnGit(cliOptions, isTestOrDebug)
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

    // Plugins
    const plugins = getPlugins(pkg)
    const alreadyInPkg = plugins.includes(packageName)

    if (alreadyInPkg) {
      warn(`${packageName} already installed, app migrations may not run!`)
    }

    // Installation
    if (isTestOrDebug) {
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies[packageName] = await getPackageTaggedVersion(packageName).then(version => version && `^${version}`) || 'latest'
      const pkgFile = path.resolve(cwd, 'package.json')
      await fs.writeJson(pkgFile, pkg, {
        spaces: 2,
      })
      if (!alreadyInPkg) {
        plugins.push(packageName)
      }
    } else if ((!alreadyInPkg || cliOptions.forceInstall) && !cliOptions.noInstall) {
      log()
      log(`📦  Installing ${chalk.cyan(packageName)}...`)
      log()

      const packageManager = loadGlobalOptions().packageManager || getPkgCommand(cwd)
      await installPackage(cwd, packageManager, cliOptions.registry, packageName)

      log(`${chalk.green('✔')}  Successfully installed plugin: ${chalk.cyan(packageName)}`)
      log()
    }

    if (!plugins.includes(packageName)) {
      error(`${packageName} is not installed, can't continue the installation`)
      process.exit(1)
    }

    // Run app migrations
    log(`🚀  Migrating app code...`)
    const migratorPlugins = await getMigratorPlugins(cwd, plugins)
    const migrator = new Migrator(cwd, {
      plugins: migratorPlugins,
      completeCbs: createCompleteCbs,
    })
    const { migrationCount } = await migrator.migrate()
    log(`📝  ${migrationCount} app migration${migrationCount > 1 ? 's' : ''} applied!`)

    log(`🎉  Successfully added ${chalk.yellow(packageName)}.`)

    migrator.displayNotices()
  }
}
