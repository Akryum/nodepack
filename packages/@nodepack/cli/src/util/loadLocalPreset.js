/** @typedef {import('@nodepack/utils').Preset} Preset */

const fs = require('fs-extra')
const loadPresetFromDir = require('./loadPresetFromDir')

/**
 * @param {string} file
 * @returns {Promise.<Preset>}
 */
module.exports = async (file) => {
  const stats = fs.statSync(file)
  if (stats.isFile()) {
    return await fs.readJson(file)
  } else if (stats.isDirectory()) {
    return await loadPresetFromDir(file)
  } else {
    throw new Error(`Invalid local preset path: ${file} is not an existing file or folder.`)
  }
}
