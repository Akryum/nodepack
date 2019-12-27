import fs from 'fs-extra'
import path from 'path'
import consola from 'consola'
import { FileTree } from '../lib/MigrationOperation'

function deleteRemovedFiles (cwd: string, newFiles: FileTree, previousFileNames: string[] = []) {
  // get all files that are not in the new filesystem and are still existing
  const filesToDelete = previousFileNames.filter(filename => !newFiles[filename])

  // delete each of these files
  return Promise.all(filesToDelete.map(filename => {
    return fs.unlink(path.join(cwd, filename))
  }))
}

export async function writeFileTree (cwd: string, files: FileTree, previousFileNames: string[] = []) {
  if (process.env.NODEPACK_SKIP_WRITE) {
    return
  }
  if (previousFileNames) {
    await deleteRemovedFiles(cwd, files, previousFileNames)
  }

  for (const filename of Object.keys(files)) {
    try {
      const file = files[filename]
      if (!file.modified) continue
      const filePath = path.join(cwd, filename)
      await fs.ensureDir(path.dirname(filePath))
      await fs.writeFile(filePath, file.source)
    } catch (e) {
      consola.error(`Error while writing ${filename}`)
      throw e
    }
  }
}
