const { Maintenance } = require('@nodepack/maintenance')
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
} = require('@nodepack/utils')
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
  }

  /**
   * @param {any} cliOptions Additional options
   */
  async add (cliOptions) {
    const { packageName, cwd } = this

    const maintenance = new Maintenance({
      cwd,
      cliOptions,
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
          const pkgFile = path.resolve(cwd, 'package.json')
          await fs.writeJson(pkgFile, pkg, {
            spaces: 2,
          })
          if (!alreadyInPkg) {
            plugins.push(packageName)
          }
        } else if ((!alreadyInPkg || cliOptions.forceInstall) && !cliOptions.noInstall) {
          await shouldCommitState()
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
      },
      after: async maintenance => {
        log(`🎉  Successfully added ${chalk.yellow(packageName)}.`)
      },
    })

    await maintenance.run()
  }
}
