/** @typedef {import('../lib/MigratorPlugin')} MigratorPlugin */

const { matchesPluginId } = require('@nodepack/utils')
const { resolveModule } = require('@nodepack/module')
const path = require('path')
const fs = require('fs-extra')

/**
 * @param {string} id
 * @param {MigratorPlugin []} plugins
 * @param {any} pkg
 */
exports.hasPlugin = (id, plugins, pkg) => {
  return [
    ...plugins.map(p => p.id),
    ...Object.keys(pkg.devDependencies),
    ...Object.keys(pkg.dependencies),
  ].some(name => matchesPluginId(id, name))
}

/**
 * @param {string} id
 * @param {string} cwd
 * @returns {string?}
 */
exports.getVersion = (id, cwd) => {
  const file = resolveModule(path.join(id, 'package.json'), cwd)
  if (file) {
    const pkg = fs.readJSONSync(file)
    return pkg.version
  }
  return null
}
