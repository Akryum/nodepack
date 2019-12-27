import { nativeRequire } from './native-require'
export { nativeRequire } from './native-require'

const resolve = nativeRequire.resolve

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
