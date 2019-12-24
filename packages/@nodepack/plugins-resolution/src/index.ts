const pluginRE = /^(@nodepack\/|nodepack-|@[\w-]+\/nodepack-)plugin-/
const scopeRE = /^@[\w-]+\//
const officialRE = /^@nodepack\//

const officialPlugins = [
  'apollo',
  'babel',
  'db-knex',
  'db-sequelize',
  'db-fauna',
  'express',
  'eslint',
  'passport',
  'typescript',
]

export function isPlugin (id: string) {
  return pluginRE.test(id)
}

export function isOfficialPlugin (id: string) {
  return isPlugin(id) && officialRE.test(id)
}

export function toShortPluginId (id: string) {
  return id.replace(pluginRE, '')
}

export function resolvePluginId (id: string) {
  // already full id
  // e.g. nodepack-plugin-foo, @nodepack/plugin-foo, @bar/nodepack-plugin-foo
  if (pluginRE.test(id)) {
    return id
  }

  if (id === '@nodepack/service') {
    return id
  }

  if (officialPlugins.includes(id)) {
    return `@nodepack/plugin-${id}`
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

export function matchesPluginId (input: string, full: string) {
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

export function getPluginLink (id: string): string {
  if (officialRE.test(id)) {
    return `https://github.com/Akryum/nodepack/tree/dev/packages/%40moonreach/nodepack-plugin-${
      exports.toShortPluginId(id)
    }`
  }
  let pkg: any = {}
  try {
    pkg = require(`${id}/package.json`)
  } catch (e) {}
  return (
    pkg.homepage ||
    (pkg.repository && pkg.repository.url) ||
    `https://www.npmjs.com/package/${id.replace(`/`, `%2F`)}`
  )
}

export function getPlugins (pkg: any) {
  return Object.keys(pkg.devDependencies || {})
    .concat(Object.keys(pkg.dependencies || {}))
    .filter(exports.isPlugin)
}
