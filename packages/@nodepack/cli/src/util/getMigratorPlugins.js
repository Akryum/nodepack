
const { MigratorPlugin } = require('@nodepack/app-migrator')
const { sortArray } = require('@nodepack/utils')
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
    const apply = loadModule(`${id}/src/app-migrations`, cwd) || (() => {})
    plugins.push(new MigratorPlugin(id, apply))
  }
  return plugins
}
