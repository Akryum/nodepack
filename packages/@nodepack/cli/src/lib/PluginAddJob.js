const chalk = require('chalk')
const { runMaintenance } = require('@nodepack/maintenance')
const { resolvePluginId } = require('@nodepack/plugins-resolution')
const {
  loadGlobalOptions,
  getPkgCommand,
  installPackage,
  getPackageTaggedVersion,
  writePkg,
} = require('@nodepack/utils')
const officialPluginShorthands = require('../util/officialPluginShorthands')
const consola = require('consola')

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
  }

  /**
   * @param {any} cliOptions Additional options
   */
  async add (cliOptions) {
    const { packageName, cwd } = this

    await runMaintenance({
      cwd,
      cliOptions,
      skipCommit: true,
      skipPreInstall: true,
      hooks: {
        before: async ({ pkg, plugins, shouldCommitState, isTestOrDebug }) => {
          // Plugins
          const alreadyInPkg = plugins.includes(packageName)

          if (alreadyInPkg) {
            consola.warn(`${packageName} already installed, migrations may not run!`)
          }

          // Installation
          if (isTestOrDebug) {
            pkg.devDependencies = pkg.devDependencies || {}
            pkg.devDependencies[packageName] = await getPackageTaggedVersion(packageName).then(version => version && `^${version}`) || 'latest'
            writePkg(cwd, pkg)
          } else if ((!alreadyInPkg || cliOptions.forceInstall) && !cliOptions.noInstall) {
            await shouldCommitState(`[nodepack] before add ${packageName}`, true)
            consola.log('')
            consola.log(`📦  Installing ${chalk.cyan(packageName)}...`)
            consola.log('')

            const packageManager = loadGlobalOptions().packageManager || getPkgCommand(cwd)
            await installPackage(cwd, packageManager, cliOptions.registry, packageName)

            consola.log(`${chalk.green('✔')}  Successfully installed plugin: ${chalk.cyan(packageName)}`)
            consola.log('')
          }

          if (!alreadyInPkg) {
            plugins.push(packageName)
          }

          if (!plugins.includes(packageName)) {
            consola.error(`${packageName} is not installed, can't continue the installation`)
            process.exit(1)
          }
        },
        after: async ({ shouldCommitState }) => {
          await shouldCommitState(`[nodepack] after add ${packageName}`, true)
          consola.success(`🎉  Successfully added ${chalk.bold(packageName)}.`)
        },
      },
    })
  }
}
