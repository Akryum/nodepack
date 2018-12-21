const path = require('path')
const fs = require('fs-extra')

/**
 * @param {string} cwd
 */
exports.getConfigFolder = cwd => path.join(cwd, '.nodepack')

/**
 * @param {string} cwd
 */
exports.ensureConfigFolder = async cwd => {
  await fs.ensureDir(exports.getConfigFolder(cwd))
}

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 * @param {any} defaultContent
 */
exports.ensureConfigFile = async (cwd, name, defaultContent) => {
  await exports.ensureConfigFolder(cwd)
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  if (!await fs.pathExists(file)) {
    if (typeof defaultContent === 'string') {
      await fs.writeFile(file, defaultContent, {
        encoding: 'utf8',
      })
    } else {
      await fs.writeJSON(file, defaultContent, {
        spaces: 2,
      })
    }
  }
}

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 */
exports.readConfigFile = async (cwd, name) => {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  return fs.readJSON(file)
}

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 * @param {any} data Object that will be serialized in JSON.
 */
exports.writeConfigFile = async (cwd, name, data) => {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  return fs.writeJSON(file, data, {
    spaces: 2,
  })
}
