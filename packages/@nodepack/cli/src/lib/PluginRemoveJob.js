const { runMaintenance } = require('@nodepack/maintenance')
const { Migrator, getMigratorPlugins } = require('@nodepack/app-migrator')
const {
  resolvePluginId,
  log,
  chalk,
  writePkg,
} = require('@nodepack/utils')
const officialPluginShorthands = require('../util/officialPluginShorthands')
const inquirer = require('inquirer')

module.exports = class PluginRemoveJob {
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
  }

  /**
   * @param {any} cliOptions Additional options
   */
  async remove (cliOptions) {
    const { packageName, cwd } = this

    if (!cliOptions.yes) {
      const { confirm } = await inquirer.prompt([
        {
          name: 'confirm',
          type: 'confirm',
          message: `Do you really want to remove ${packageName}?`,
        },
      ])
      if (!confirm) {
        process.exit()
      }
    }

    await runMaintenance({
      cwd,
      cliOptions,
      skipCommit: true,
      skipPreInstall: true,
      before: async ({ pkg, plugins, shouldCommitState, installDeps }) => {
        const migratorPlugins = await getMigratorPlugins(cwd, plugins)
        const migrator = new Migrator(cwd, {
          plugins: migratorPlugins,
        })
        const { migrations } = await migrator.prepareRollback([packageName])
        if (migrations.length) {
          await shouldCommitState(`[nodepack] before remove ${packageName}`, true)
          log(`🚀  Rollbacking app code...`)
          const { rollbackCount } = await migrator.rollback([packageName])
          log(`📝  ${rollbackCount} app rollback${rollbackCount > 1 ? 's' : ''} applied!`)
        }

        const index = plugins.indexOf(packageName)
        if (index !== -1) plugins.splice(index, 1)

        if (!cliOptions.skipUninstall) {
          delete pkg.dependencies[packageName]
          delete pkg.devDependencies[packageName]
          writePkg(cwd, pkg)
          await installDeps(`📦  Uninstalling dependencies...`)
        }
      },
      after: async ({ shouldCommitState }) => {
        await shouldCommitState(`[nodepack] after remove ${packageName}`, true)
        log(`🎉  Successfully removed ${chalk.yellow(packageName)}.`)
      },
    })
  }
}
