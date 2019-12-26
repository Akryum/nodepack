/** @typedef {import('@nodepack/utils').Preset} Preset */

const path = require('path')
const chalk = require('chalk')
const loadLocalPreset = require('./loadLocalPreset')
const loadRemotePreset = require('./loadRemotePreset')
const {
  loadGlobalOptions,
  saveGlobalOptions,
  logWithSpinner,
  stopSpinner,
  defaultPreset,
} = require('@nodepack/utils')
const consola = require('consola')

/**
* @param {string} presetName
* @param {boolean} clone
*/
exports.resolvePreset = async function (presetName, clone = false) {
  let preset = null
  const savedPresets = loadGlobalOptions().presets || {}

  if (presetName in savedPresets) {
    preset = savedPresets[presetName]
  } else if (presetName.endsWith('.json') || /^\./.test(presetName) || path.isAbsolute(presetName)) {
    preset = await loadLocalPreset(path.resolve(presetName))
  } else if (presetName.includes('/')) {
    logWithSpinner(`Fetching remote preset ${chalk.cyan(presetName)}...`)
    try {
      preset = await loadRemotePreset(presetName, clone)
      stopSpinner()
    } catch (e) {
      stopSpinner()
      consola.error(`Failed fetching remote preset ${chalk.cyan(presetName)}:`)
      throw e
    }
  }

  // use default preset if user has not overwritten it
  if (presetName === 'default' && !preset) {
    preset = defaultPreset
  }
  if (!preset) {
    consola.error(`preset "${presetName}" not found.`)
    const presets = Object.keys(savedPresets)
    if (presets.length) {
      consola.log('')
      consola.log(`available presets:\n${presets.join(`\n`)}`)
    } else {
      consola.log(`you don't seem to have any saved preset.`)
      consola.log(`run 'nodepack create' in manual mode to create a preset.`)
    }
    process.exit(1)
  }
  return preset
}

exports.getPresetFromAnswers = async function (answers, promptCompleteCbs) {
  if (answers.packageManager) {
    saveGlobalOptions({
      packageManager: answers.packageManager,
    })
  }

  /** @type {Preset?} */
  let preset
  if (answers.preset && answers.preset !== '__manual__') {
    preset = await exports.resolvePreset(answers.preset)
  } else {
    // manual
    preset = {
      useConfigFiles: answers.useConfigFiles === 'files',
      plugins: {},
      appMigrations: {},
    }
    answers.features = answers.features || []
    // run cb registered by prompt modules to finalize the preset
    for (const cb of promptCompleteCbs) {
      await cb(answers, preset)
    }
  }

  return preset
}
