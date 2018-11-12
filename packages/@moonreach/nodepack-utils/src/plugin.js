const pluginRE = /^(@moonreach\/|nodepack-|@[\w-]+\/nodepack-)plugin-/
const scopeRE = /^@[\w-]+\//
const officialRE = /^@moonreach\//

exports.isPlugin = id => pluginRE.test(id)

exports.isOfficialPlugin = id => exports.isPlugin(id) && officialRE.test(id)

exports.toShortPluginId = id => id.replace(pluginRE, '')

exports.resolvePluginId = id => {
  // already full id
  // e.g. nodepack-plugin-foo, @moonreach/nodepack-plugin-foo, @bar/nodepack-plugin-foo
  if (pluginRE.test(id)) {
    return id
  }
  // scoped short
  // e.g. @moonreach/foo, @bar/foo
  if (id.charAt(0) === '@') {
    const scopeMatch = id.match(scopeRE)
    if (scopeMatch) {
      const scope = scopeMatch[0]
      const shortId = id.replace(scopeRE, '')
      return `${scope}nodepack-plugin-${shortId}`
    }
  }
  // default short
  // e.g. foo
  return `nodepack-plugin-${id}`
}

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

exports.getPluginLink = id => {
  if (officialRE.test(id)) {
    return `https://github.com/moonreach/nodepack/tree/dev/packages/%40moonreach/nodepack-plugin-${
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
