/** @typedef {import('@nodepack/utils').Preset} Preset */

const fs = require('fs-extra')
const loadPresetFromDir = require('./loadPresetFromDir')

/**
 * @param {string} presetName
 * @param {boolean} clone
 * @returns {Promise.<Preset>}
 */
module.exports = async (presetName, clone) => {
  const os = require('os')
  const path = require('path')
  const download = require('download-git-repo')
  const tmpdir = path.join(os.tmpdir(), 'nodepack')

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  if (clone) {
    await fs.remove(tmpdir)
  }

  await new Promise((resolve, reject) => {
    download(presetName, tmpdir, { clone }, err => {
      if (err) return reject(err)
      resolve()
    })
  })

  return loadPresetFromDir(tmpdir)
}
