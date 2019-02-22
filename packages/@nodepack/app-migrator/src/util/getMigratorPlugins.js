const MigratorPlugin = require('../lib/MigratorPlugin')
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
    const files = [
      `${id}/app-migrations`,
      `${id}/dist/app-migrations`,
      `${id}/src/app-migrations`,
    ]
    for (const file of files) {
      try {
        const apply = loadModule(file, cwd)
        if (!apply) continue
        plugins.push(new MigratorPlugin(id, apply))
        break
      } catch (e) {
        // File not found
      }
    }
  }
  return plugins
}
