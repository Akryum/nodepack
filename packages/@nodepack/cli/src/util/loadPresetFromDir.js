/** @typedef {import('@nodepack/utils').Preset} Preset */

const path = require('path')
const fs = require('fs-extra')

/**
 * @param {string} dir
 * @returns {Promise.<Preset>}
 */
module.exports = async (dir) => {
  const presetPath = path.join(dir, 'preset.json')
  if (!fs.existsSync(presetPath)) {
    throw new Error('remote / local preset does not contain preset.json!')
  }
  return await fs.readJson(presetPath)
}
