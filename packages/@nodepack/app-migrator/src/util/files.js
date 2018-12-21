/** @typedef {import('../lib/MigrationOperation').FileTree} FileTree */

const path = require('path')
const MigrationOperationFile = require('../lib/MigrationOperationFile')
const slash = require('slash')

exports.resolveFile = (cwd, file) => path.resolve(cwd, file)

/**
 * Resolves files with `globby`.
 *
 * @param {string} cwd Current working directory.
 * @param {string} pattern `globby` pattern.
 * @param {((file: String) => any | Promise<any>)?} map File transform.
 * @returns {Promise.<Object.<string, any>>}
 */
exports.resolveFiles = async (cwd, pattern = '**', map = null) => {
  const result = {}
  const globby = require('globby')

  const files = globby.sync([pattern], {
    cwd,
    onlyFiles: true,
    gitignore: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
    dot: true,
  })

  for (let file of files) {
    // Normalize file path
    file = slash(file)

    if (map) {
      result[file] = map(file)
    } else {
      result[file] = path.resolve(cwd, file)
    }
  }

  return result
}

/**
 * @returns {Promise.<FileTree>}
 */
exports.readFiles = async (cwd) => {
  return exports.resolveFiles(cwd, '**', (file) => new MigrationOperationFile(file))
}

exports.normalizeFilePaths = (files) => {
  Object.keys(files).forEach(file => {
    const normalized = slash(file)
    if (file !== normalized) {
      files[normalized] = files[file]
      delete files[file]
    }
  })
  return files
}
