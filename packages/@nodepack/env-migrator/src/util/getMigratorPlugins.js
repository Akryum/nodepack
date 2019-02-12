const path = require('path')
const MigratorPlugin = require('../lib/MigratorPlugin')
const { sortArray, readPkg } = require('@nodepack/utils')
const { loadModule } = require('@nodepack/module')

/**
 * @param {string} cwd
 * @param {string []} rawIds
 */
module.exports = async function (cwd, rawIds) {
  // ensure service is invoked first
  rawIds = sortArray(rawIds, ['@nodepack/service'], true)
  const plugins = []
  for (const id of rawIds) {
    const pkg = readPkg(path.resolve(cwd, id))
    const file = (pkg.nodepack && pkg.nodepack.entries && pkg.nodepack.entries.envMigrations) || `${id}/src/env-migrations`
    const apply = loadModule(file, cwd) || (() => {})
    plugins.push(new MigratorPlugin(id, apply))
  }
  return plugins
}
