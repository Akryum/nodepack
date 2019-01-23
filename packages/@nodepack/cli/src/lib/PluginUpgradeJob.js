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
  writePkg,
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
      before: async ({ pkg, shouldCommitState, installDeps, isTestOrDebug }) => {
        logWithSpinner(`🔄`, `Checking for plugin updates...`)
        const { updateInfos, wantedUpgrades, latestUpgrades, totalUpgrades } = await this.resolveUpdates(pkg, packageNames)
        stopSpinner()

        // No updates
        if (wantedUpgrades === 0 && latestUpgrades === 0) {
          log(`${chalk.green('✔')}  No plugin updates available.`)
          process.exit()
        }

        if (!cliOptions.wanted && !cliOptions.latest) {
          // Main action prompt
          const mainChoices = []
          if (wantedUpgrades) {
            mainChoices.push({
              name: chalk.green(`Update ${chalk.bold(wantedUpgrades.toString())} plugins to their wanted version`),
              value: 'updateAllWanted',
            })
          }
          mainChoices.push({
            name: chalk.green(`Manually select for each plugin`),
            value: 'manual',
          })
          if (latestUpgrades) {
            mainChoices.push({
              name: chalk.yellow(`Update ${chalk.bold(latestUpgrades.toString())} plugins to their latest version`),
              value: 'updateAllLatest',
            })
          }
          const { action } = await inquirer.prompt([
            {
              name: 'action',
              type: 'list',
              message: `${chalk.bold(totalUpgrades.toString())} plugin updates available`,
              choices: mainChoices,
            },
          ])

          if (action === 'manual') {
            queuedUpdates = await this.selectUpdates(updateInfos)
          } else if (action === 'updateAllWanted') {
            queuedUpdates = updateInfos.filter(i => i.canUpdateWanted).map(i => ({
              info: i,
              version: this.getUpdatedVersionRange(i, i.versionsInfo.wanted) || i.versionRange,
            }))
          } else if (action === 'updateAllLatest') {
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
                message: `Confirm ${count} plugin update${count > 1 ? 's' : ''}?`,
              }])
              if (!confirm) process.exit()
            }

            await shouldCommitState(`[nodepack] before update ${count} plugin${count > 1 ? 's' : ''}`, true)

            for (const update of queuedUpdates) {
              pkg[update.info.dependencyType][update.info.id] = update.version
            }
            writePkg(cwd, pkg)

            if (!isTestOrDebug) {
              await installDeps(`📦  Updating packages...`)
            }
          } else {
            log(`${chalk.green('✔')}  No plugin updates applied.`)
            process.exit()
          }
        }
      },
      after: async ({ shouldCommitState }) => {
        const count = queuedUpdates.length
        await shouldCommitState(`[nodepack] after update ${chalk.yellow(`${count} plugin${count > 1 ? 's' : ''}`)}`), true
        log(`🎉  Successfully upgraded ${chalk.yellow(`${count} plugin${count > 1 ? 's' : ''}`)}.`)
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
        link = medata.body.homepage
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
          choices: [],
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
}
