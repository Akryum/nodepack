import path from 'path'
import { MigrationOperationFile } from '../lib/MigrationOperationFile'
import { FileTree } from '../lib/MigrationOperation'
import slash from 'slash'

export function resolveFile (cwd: string, file: string) {
  return path.resolve(cwd, file)
}

/**
 * Resolves files with `globby`.
 *
 * @param cwd Current working directory.
 * @param pattern `globby` pattern.
 * @param map File transform.
 */
export async function resolveFiles<T = any> (
  cwd: string,
  pattern = '**',
  map: (file: string) => T | Promise<T> = null,
): Promise<{ [key: string]: T }> {
  const result = {}
  const globby = require('globby')

  const files = globby.sync([pattern], {
    cwd,
    onlyFiles: true,
    gitignore: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
    dot: true,
  })

  for (let file of files) {
    // Normalize file path
    file = slash(file)

    if (map) {
      result[file] = map(file)
    } else {
      result[file] = path.resolve(cwd, file)
    }
  }

  return result
}

export async function readFiles (cwd): Promise<FileTree> {
  return resolveFiles(cwd, '**', (file) => new MigrationOperationFile(cwd, file))
}

export function normalizeFilePaths (files: { [key: string]: any }) {
  Object.keys(files).forEach(file => {
    const normalized = slash(file)
    if (file !== normalized) {
      files[normalized] = files[file]
      delete files[file]
    }
  })
  return files
}
