import semver from 'semver'
import { nativeRequire } from './native-require'
import Module from 'module'

export { nativeRequire } from './native-require'

function resolveFallback (id: string, options?: { paths?: string[] }): string {
  const isMain = false
  const fakeParent = new Module('', null)

  const paths = []

  if (options && options.paths) {
    for (let i = 0; i < options.paths.length; i++) {
      const path = options.paths[i]
      // @ts-ignore
      fakeParent.paths = Module._nodeModulePaths(path)
      // @ts-ignore
      const lookupPaths = Module._resolveLookupPaths(id, fakeParent, true)

      if (!paths.includes(path)) paths.push(path)

      for (let j = 0; j < lookupPaths.length; j++) {
        if (!paths.includes(lookupPaths[j])) paths.push(lookupPaths[j])
      }
    }
  }

  // @ts-ignore
  const filename = Module._findPath(id, paths, isMain)
  if (!filename) {
    const err = new Error(`Cannot find module '${id}'`)
    // @ts-ignore
    err.code = 'MODULE_NOT_FOUND'
    throw err
  }
  return filename
}

const resolve = semver.satisfies(process.version, '>=10.0.0')
  ? nativeRequire.resolve
  : resolveFallback

function clearRequireCache (id: string, map = new Map<string, boolean>()): void {
  const module = nativeRequire.cache[id]
  if (module) {
    map.set(id, true)
    // Clear children modules
    module.children.forEach(child => {
      if (!map.get(child.id)) clearRequireCache(child.id, map)
    })
    delete nativeRequire.cache[id]
  }
}

/**
 * @param cwd working folder
 */
export function resolveModule (request: string, cwd: string): string | undefined {
  let resolvedPath
  try {
    resolvedPath = resolve(request, {
      paths: [cwd],
    })
  } catch (e) {}
  return resolvedPath
}

/**
 * @param {string} cwd working folder
 */
export function loadModule (request: string, cwd: string, force = false): any {
  const resolvedPath = exports.resolveModule(request, cwd)
  if (resolvedPath) {
    if (force) {
      clearRequireCache(resolvedPath)
    }
    return nativeRequire(resolvedPath)
  }
}

/**
 * @param {string} cwd working folder
 */
export function clearModule (request: string, cwd: string): void {
  const resolvedPath = exports.resolveModule(request, cwd)
  if (resolvedPath) {
    clearRequireCache(resolvedPath)
  }
}

export function mayBeNodeModule (module: string): boolean {
  return !exports.isRelative(module) && !exports.isAbsolute(module) && module && !module.match(/^@\//)
}

export function isRelative (module: string): boolean {
  if (!module) return false
  return module.startsWith('./') || module.startsWith('../')
}

export function isAbsolute (module: string): boolean {
  if (!module) return false
  return module.startsWith('/') || !!module.match(/^\w:(\\|\/)/)
}
