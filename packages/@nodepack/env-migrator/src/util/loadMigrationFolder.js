const globby = require('globby')
const { loadModule } = require('@nodepack/module')
const fs = require('fs')
const path = require('path')
const consola = require('consola')

/**
 * @typedef Module
 * @prop {string} file
 * @prop {function} up
 * @prop {function} down
 */

/**
 * @param {string} cwd
 * @param {string} folder
 */
exports.findMigrations = async function (cwd, folder) {
  const folderPath = path.join(cwd, folder)
  if (!fs.existsSync(folderPath)) {
    return []
  }
  let files = await globby(`${folder}/**/*.js`, {
    cwd,
  })
  files = files.sort((a, b) => a.localeCompare(b))
  return files
}

/**
 * @param {string} cwd
 * @param {string[]} files
 */
exports.loadMigrations = async function (cwd, files) {
  /** @type {Module[]} */
  const modules = []
  files.forEach(file => {
    try {
      const code = loadModule(path.join(cwd, file), cwd, true)
      const { up = null, down = null } = code || {}
      if (!up && !down) {
        consola.warn(`No up or down functions exported in ${file}`)
      } else {
        modules.push({
          file,
          up,
          down,
        })
      }
    } catch (e) {
      consola.warn(`Error while loading migration ${file}: ${e.message}`)
    }
  })
  return modules
}
