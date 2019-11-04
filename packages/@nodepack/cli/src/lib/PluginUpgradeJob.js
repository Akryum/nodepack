/** @typedef {import('inquirer').Questions} Questions */
/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('@nodepack/utils/src/deps').PackageVersionsInfo} PackageVersionsInfo */

/**
 * @typedef UpdateInfo
 * @prop {string} id
 * @prop {string?} link
 * @prop {string} versionRange
 * @prop {PackageVersionsInfo} versionsInfo
 * @prop {boolean} canUpdateWanted
 * @prop {boolean} canUpdateLatest
 * @prop {'dependencies' | 'devDependencies'} dependencyType
 */

/**
 * @typedef QueuedUpdate
 * @prop {string} version
 * @prop {UpdateInfo} info
 */

const { runMaintenance } = require('@nodepack/maintenance')
const {
  resolvePluginId,
  log,
  logWithSpinner,
  stopSpinner,
  chalk,
  getPackageMetadata,
  getPackageVersionsInfo,
  updatePackage,
} = require('@nodepack/utils')
const officialPluginShorthands = require('../util/officialPluginShorthands')
const inquirer = require('inquirer')
const semver = require('semver')

module.exports = class PluginUpgradeJob {
  /**
   * @param {string[]} pluginNames
   * @param {string} cwd
   */
  constructor (pluginNames, cwd) {
    this.packageNames = pluginNames.map(pluginName => {
      if (officialPluginShorthands.includes(pluginName)) {
        pluginName = `@nodepack/plugin-${pluginName}`
      }
      return resolvePluginId(pluginName)
    })
    this.cwd = cwd
  }

  /**
   * @param {any} cliOptions Additional options
   */
  async upgrade (cliOptions) {
    const { packageNames, cwd } = this

    /** @type {QueuedUpdate []} */
    let queuedUpdates = []

    await runMaintenance({
      cwd,
      cliOptions,
      skipCommit: true,
      skipPreInstall: true,
      hooks: {
        before: async ({ pkg, plugins, shouldCommitState, packageManager, isTestOrDebug }) => {
          /** @type {string []} */
          let selectedPlugins
          if (packageNames.length) {
            // Selected from command arguments
            selectedPlugins = packageNames
          } else {
            // By default, select service + all plugins
            selectedPlugins = [
              '@nodepack/service',
              ...plugins,
            ]
          }

          logWithSpinner(`🔄`, `Checking for plugin upgrades...`)
          const { updateInfos, wantedUpgrades, latestUpgrades, totalUpgrades } = await this.resolveUpdates(pkg, selectedPlugins)
          stopSpinner()

          // No updates
          if (wantedUpgrades === 0 && latestUpgrades === 0) {
            log(`${chalk.green('✔')}  No plugin upgrades available.`)
            process.exit()
          } else {
            this.printAvailableUpdates(updateInfos)
          }

          if (!cliOptions.wanted && !cliOptions.latest) {
            // Main action prompt
            const mainChoices = []
            if (wantedUpgrades) {
              mainChoices.push({
                name: chalk.green(`Update ${chalk.bold(wantedUpgrades.toString())} plugins to their wanted version`),
                value: 'upgradeAllWanted',
              })
            }
            mainChoices.push({
              name: chalk.green(`Manually select for each plugin`),
              value: 'manual',
            })
            if (latestUpgrades) {
              mainChoices.push({
                name: chalk.yellow(`Update ${chalk.bold(latestUpgrades.toString())} plugins to their latest version`),
                value: 'upgradeAllLatest',
              })
            }
            const { action } = await inquirer.prompt([
              {
                name: 'action',
                type: 'list',
                message: `${chalk.bold(totalUpgrades.toString())} plugin upgrades available`,
                choices: mainChoices,
              },
            ])

            if (action === 'manual') {
              queuedUpdates = await this.selectUpdates(updateInfos)
            } else if (action === 'upgradeAllWanted') {
              queuedUpdates = updateInfos.filter(i => i.canUpdateWanted).map(i => ({
                info: i,
                version: this.getUpdatedVersionRange(i, i.versionsInfo.wanted) || i.versionRange,
              }))
            } else if (action === 'upgradeAllLatest') {
              queuedUpdates = updateInfos.filter(i => i.canUpdateLatest).map(i => ({
                info: i,
                version: this.getUpdatedVersionRange(i, i.versionsInfo.latest) || 'latest',
              }))
            }

            const count = queuedUpdates.length
            if (count) {
              if (!cliOptions.yes) {
                const { confirm } = await inquirer.prompt([{
                  name: 'confirm',
                  type: 'confirm',
                  message: `Confirm ${count} plugin upgrade${count > 1 ? 's' : ''}?`,
                }])
                if (!confirm) process.exit()
              }

              await shouldCommitState(`[nodepack] before upgrade ${count} plugin${count > 1 ? 's' : ''}`, true)

              if (!isTestOrDebug) {
                log(`📦  Upgrading packages...`)
                await updatePackage(cwd, packageManager, cliOptions.registry, queuedUpdates.map(
                  u => `${u.info.id}@${u.version}`,
                ).join(' '))
              }
            } else {
              log(`${chalk.green('✔')}  No plugin upgrades applied.`)
              process.exit()
            }
          }
        },
        after: async ({ shouldCommitState }) => {
          const count = queuedUpdates.length
          await shouldCommitState(`[nodepack] after upgrade ${count} plugin${count > 1 ? 's' : ''}`, true)
          log(`🎉  Successfully upgraded ${chalk.yellow(`${count} plugin${count > 1 ? 's' : ''}`)}.`)
        },
      },
    })
  }

  /**
   * @param {any} pkg
   * @param {string []} plugins
   */
  async resolveUpdates (pkg, plugins) {
    /** @type {UpdateInfo []} */
    const updateInfos = []
    let wantedUpgrades = 0
    let latestUpgrades = 0
    let totalUpgrades = 0
    for (const id of plugins) {
      const versionRange = pkg.dependencies[id] || pkg.devDependencies[id]
      const versionsInfo = await getPackageVersionsInfo(this.cwd, id, versionRange)
      let canUpdateWanted = false
      let canUpdateLatest = false
      if (versionsInfo.current !== null) {
        canUpdateWanted = versionsInfo.current !== versionsInfo.wanted
        canUpdateLatest = versionsInfo.current !== versionsInfo.latest
        // Count
        if (canUpdateWanted) wantedUpgrades++
        if (canUpdateLatest) latestUpgrades++
        if (canUpdateWanted || canUpdateLatest) totalUpgrades++
      }
      let link = null
      const medata = await getPackageMetadata(id)
      if (medata) {
        link = medata.homepage
      }
      updateInfos.push({
        id,
        link,
        versionRange,
        versionsInfo,
        canUpdateWanted,
        canUpdateLatest,
        dependencyType: id in pkg.dependencies ? 'dependencies' : 'devDependencies',
      })
    }
    return {
      updateInfos,
      wantedUpgrades,
      latestUpgrades,
      totalUpgrades,
    }
  }

  /**
   * @param {UpdateInfo []} updateInfos
   * @returns {Promise.<QueuedUpdate []>}
   */
  async selectUpdates (updateInfos) {
    /** @type {Question []} */
    const prompts = []
    for (const updateInfo of updateInfos) {
      if (updateInfo.canUpdateWanted || updateInfo.canUpdateLatest) {
        const choices = []
        if (updateInfo.canUpdateWanted) {
          choices.push({
            name: chalk.green(`Update to wanted (${updateInfo.versionsInfo.wanted})`),
            value: this.getUpdatedVersionRange(updateInfo, updateInfo.versionsInfo.wanted),
          })
        } if (updateInfo.canUpdateLatest) {
          choices.push({
            name: chalk.yellow(`Update to latest (${updateInfo.versionsInfo.latest})`),
            value: this.getUpdatedVersionRange(updateInfo, updateInfo.versionsInfo.latest),
          })
        }
        choices.push({ name: 'Skip', value: null })
        prompts.push({
          name: updateInfo.id,
          type: 'list',
          message: `${updateInfo.id} ${updateInfo.link ? `(${updateInfo.link}) ` : ''} ${chalk.grey(updateInfo.dependencyType)}`,
          choices,
        })
      }
    }
    const answers = await inquirer.prompt(prompts)
    const result = []
    for (const id in answers) {
      const version = answers[id]
      const info = updateInfos.find(i => i.id === id)
      if (version && info) {
        result.push({
          info,
          version,
        })
      }
    }
    return result
  }

  /**
   * @param {UpdateInfo} updateInfo
   * @param {string?} version
   */
  getUpdatedVersionRange (updateInfo, version) {
    const { versionRange } = updateInfo
    if (version && semver.validRange(versionRange)) {
      const match = versionRange.match(/\d+/)
      if (match) {
        return `${versionRange.substr(0, match.index)}${version}`
      } else {
        return version
      }
    }
    return versionRange
  }

  /**
   * @param {UpdateInfo []} updateInfos
   */
  printAvailableUpdates (updateInfos) {
    updateInfos = updateInfos.filter(i => i.canUpdateWanted || i.canUpdateLatest)
      .sort((a, b) => {
        if (a.canUpdateWanted && !b.canUpdateWanted) return -1
        if (!a.canUpdateWanted && b.canUpdateWanted) return 1
        return 0
      })

    const ui = require('cliui')({ width: 90 })

    function makeRow (id, a, b, c) {
      return `${id}\t    ${a}\t ${b}\t ${c}`
    }

    log(`Available updates:\n`)

    ui.div(
      makeRow(
        chalk.cyan.bold(`Id`),
        chalk.cyan.bold(`Current`),
        chalk.cyan.bold(`Wanted`),
        chalk.cyan.bold(`Latest`),
      ) + `\n` +
      updateInfos.map(infos => {
        const { current, wanted, latest } = infos.versionsInfo

        function formatVersion (version) {
          if (version !== '?' && version !== current) {
            return chalk.bold(version)
          }
          return version
        }

        return makeRow(
          infos.id,
          chalk.blue(`${current || '?'}`),
          chalk.green(`${formatVersion(wanted || '?')}`),
          chalk.yellow(`${formatVersion(latest || '?')}`),
        )
      }).join(`\n`),
    )

    log(`${ui.toString()}\n`)
  }
}
