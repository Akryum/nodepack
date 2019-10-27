import fs from 'fs-extra'
import path from 'path'

export function getConfigFolder (cwd: string): string {
  return path.join(cwd, '.nodepack')
}

/**
 * @param cwd Working directory.
 * @param name File name.
 */
export function readConfigFileSync (cwd: string, name: string): any {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  return fs.readJSONSync(file)
}
