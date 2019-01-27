const pluginRE = /^(@nodepack\/|nodepack-|@[\w-]+\/nodepack-)plugin-/
const scopeRE = /^@[\w-]+\//
const officialRE = /^@nodepack\//

/**
 * @param {string} id
 */
exports.isPlugin = id => pluginRE.test(id)

/**
 * @param {string} id
 */
exports.isOfficialPlugin = id => exports.isPlugin(id) && officialRE.test(id)

/**
 * @param {string} id
 */
exports.toShortPluginId = id => id.replace(pluginRE, '')

/**
 * @param {string} id
 */
exports.resolvePluginId = id => {
  // already full id
  // e.g. nodepack-plugin-foo, @nodepack/plugin-foo, @bar/nodepack-plugin-foo
  if (pluginRE.test(id)) {
    return id
  }
  // scoped short
  // e.g. @nodepack/foo, @bar/foo
  if (id.charAt(0) === '@') {
    const scopeMatch = id.match(scopeRE)
    if (scopeMatch) {
      const scope = scopeMatch[0]
      const shortId = id.replace(scopeRE, '')
      return `${scope}${scope === '@nodepack/' ? `` : `nodepack-`}plugin-${shortId}`
    }
  }
  // default short
  // e.g. foo
  return `nodepack-plugin-${id}`
}

/**
 * @param {string} input
 * @param {string} full
 */
exports.matchesPluginId = (input, full) => {
  const short = full.replace(pluginRE, '')
  return (
    // input is full
    full === input ||
    // input is short without scope
    short === input ||
    // input is short with scope
    short === input.replace(scopeRE, '')
  )
}

/**
 * @param {string} id
 * @returns {string}
 */
exports.getPluginLink = id => {
  if (officialRE.test(id)) {
    return `https://github.com/Akryum/nodepack/tree/dev/packages/%40moonreach/nodepack-plugin-${
      exports.toShortPluginId(id)
    }`
  }
  let pkg = {}
  try {
    pkg = require(`${id}/package.json`)
  } catch (e) {}
  return (
    pkg.homepage ||
    (pkg.repository && pkg.repository.url) ||
    `https://www.npmjs.com/package/${id.replace(`/`, `%2F`)}`
  )
}

exports.getPlugins = function (pkg) {
  return Object.keys(pkg.devDependencies || {})
    .concat(Object.keys(pkg.dependencies || {}))
    .filter(exports.isPlugin)
}
