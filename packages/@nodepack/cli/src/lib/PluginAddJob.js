const { runMaintenance } = require('@nodepack/maintenance')
const {
  resolvePluginId,
  log,
  warn,
  error,
  chalk,
  loadGlobalOptions,
  getPkgCommand,
  installPackage,
  getPackageTaggedVersion,
  writePkg,
} = require('@nodepack/utils')
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
      before: async ({ pkg, plugins, shouldCommitState, isTestOrDebug }) => {
        // Plugins
        const alreadyInPkg = plugins.includes(packageName)

        if (alreadyInPkg) {
          warn(`${packageName} already installed, migrations may not run!`)
        }

        // Installation
        if (isTestOrDebug) {
          pkg.devDependencies = pkg.devDependencies || {}
          pkg.devDependencies[packageName] = await getPackageTaggedVersion(packageName).then(version => version && `^${version}`) || 'latest'
          writePkg(cwd, pkg)
        } else if ((!alreadyInPkg || cliOptions.forceInstall) && !cliOptions.noInstall) {
          await shouldCommitState(`[nodepack] before add ${packageName}`, true)
          log()
          log(`📦  Installing ${chalk.cyan(packageName)}...`)
          log()

          const packageManager = loadGlobalOptions().packageManager || getPkgCommand(cwd)
          await installPackage(cwd, packageManager, cliOptions.registry, packageName)

          log(`${chalk.green('✔')}  Successfully installed plugin: ${chalk.cyan(packageName)}`)
          log()
        }

        if (!alreadyInPkg) {
          plugins.push(packageName)
        }

        if (!plugins.includes(packageName)) {
          error(`${packageName} is not installed, can't continue the installation`)
          process.exit(1)
        }
      },
      after: async ({ shouldCommitState }) => {
        await shouldCommitState(`[nodepack] after add ${packageName}`, true)
        log(`🎉  Successfully added ${chalk.yellow(packageName)}.`)
      },
    })
  }
}
