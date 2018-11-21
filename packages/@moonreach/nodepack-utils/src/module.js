const semver = require('semver')

function resolveFallback (request, options) {
  const Module = require('module')
  const isMain = false
  // @ts-ignore
  const fakeParent = new Module('', null)

  const paths = []

  for (let i = 0; i < options.paths.length; i++) {
    const path = options.paths[i]
    // @ts-ignore
    fakeParent.paths = Module._nodeModulePaths(path)
    // @ts-ignore
    const lookupPaths = Module._resolveLookupPaths(request, fakeParent, true)

    if (!paths.includes(path)) paths.push(path)

    for (let j = 0; j < lookupPaths.length; j++) {
      if (!paths.includes(lookupPaths[j])) paths.push(lookupPaths[j])
    }
  }

  // @ts-ignore
  const filename = Module._findPath(request, paths, isMain)
  if (!filename) {
    const err = new Error(`Cannot find module '${request}'`)
    // @ts-ignore
    err.code = 'MODULE_NOT_FOUND'
    throw err
  }
  return filename
}

const resolve = semver.satisfies(process.version, '>=10.0.0')
  ? require.resolve
  : resolveFallback

/**
 * @param {string} request
 * @param {string} cwd working folder
 */
exports.resolveModule = function (request, cwd) {
  let resolvedPath
  try {
    resolvedPath = resolve(request, {
      paths: [cwd],
    })
  } catch (e) {}
  return resolvedPath
}

/**
 * @param {string} request
 * @param {string} cwd working folder
 */
exports.loadModule = function (request, cwd, force = false) {
  const resolvedPath = exports.resolveModule(request, cwd)
  if (resolvedPath) {
    if (force) {
      clearRequireCache(resolvedPath)
    }
    return require(resolvedPath)
  }
}

/**
 * @param {string} request
 * @param {string} cwd working folder
 */
exports.clearModule = function (request, cwd) {
  const resolvedPath = exports.resolveModule(request, cwd)
  if (resolvedPath) {
    clearRequireCache(resolvedPath)
  }
}

function clearRequireCache (id, map = new Map()) {
  const module = require.cache[id]
  if (module) {
    map.set(id, true)
    // Clear children modules
    module.children.forEach(child => {
      if (!map.get(child.id)) clearRequireCache(child.id, map)
    })
    delete require.cache[id]
  }
}

exports.mayBeNodeModule = function (module) {
  return !exports.isRelative(module) && !exports.isAbsolute(module) && !module.match(/^@\//)
}

exports.isRelative = function (module) {
  return module.startsWith('./') || module.startsWith('../')
}

exports.isAbsolute = function (module) {
  return module.startsWith('/') || module.match(/^\w:(\\|\/)/)
}
