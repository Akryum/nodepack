const fs = require('fs-extra')
const path = require('path')

/**
 * @param {string} cwd
 */
exports.getConfigFolder = cwd => path.join(cwd, '.nodepack')

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 */
exports.readConfigFileSync = (cwd, name) => {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  return fs.readJSONSync(file)
}
