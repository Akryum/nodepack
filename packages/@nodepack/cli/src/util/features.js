/** @typedef {import('@nodepack/utils').Preset} Preset */

const { toShortPluginId } = require('@nodepack/plugins-resolution')
const chalk = require('chalk')

/**
 * @param {Preset} preset
 */
exports.getFeatures = (preset) => {
  return Object.keys(preset.plugins || []).filter(dep => {
    return dep !== '@nodepack/service'
  })
}

/**
 * @param {Preset} preset
 * @param {string} lead
 * @param {string} joiner
 */
exports.formatFeatures = (preset, lead = '', joiner = ', ') => {
  const features = exports.getFeatures(preset)
  return features.map(dep => {
    dep = toShortPluginId(dep)
    return `${lead}${chalk.yellow(dep)}`
  }).join(joiner)
}
