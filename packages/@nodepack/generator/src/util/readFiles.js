/** @typedef {import('../lib/Generator').FileTree} FileTree */

const GeneratorFile = require('../lib/GeneratorFile')

/**
 * @returns {Promise.<FileTree>}
 */
module.exports = async function (cwd) {
  const path = require('path')
  const globby = require('globby')
  const normalizeFilePaths = require('./normalizeFilePaths')

  const files = await globby(['**'], {
    cwd,
    onlyFiles: true,
    gitignore: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
    dot: true,
  })
  const res = {}
  for (const file of files) {
    const name = path.resolve(cwd, file)
    res[file] = new GeneratorFile(name)
  }
  return normalizeFilePaths(res)
}
