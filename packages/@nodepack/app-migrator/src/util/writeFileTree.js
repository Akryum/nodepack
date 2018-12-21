/** @typedef {import('../lib/MigrationOperation').FileTree} FileTree */

const fs = require('fs-extra')
const path = require('path')

/**
 * @param {string} cwd
 * @param {FileTree} newFiles
 * @param {string []} previousFileNames
 */
function deleteRemovedFiles (cwd, newFiles, previousFileNames) {
  // get all files that are not in the new filesystem and are still existing
  const filesToDelete = previousFileNames.filter(filename => !newFiles[filename])

  // delete each of these files
  return Promise.all(filesToDelete.map(filename => {
    return fs.unlink(path.join(cwd, filename))
  }))
}

/**
 * @param {string} cwd
 * @param {FileTree} files
 * @param {string []} [previousFileNames]
 */
module.exports = async function (cwd, files, previousFileNames) {
  if (process.env.NODEPACK_SKIP_WRITE) {
    return
  }
  if (previousFileNames) {
    await deleteRemovedFiles(cwd, files, previousFileNames)
  }

  for (const filename of Object.keys(files)) {
    const file = files[filename]
    if (!file.modified) continue
    const filePath = path.join(cwd, filename)
    await fs.ensureDir(path.dirname(filePath))
    await fs.writeFile(filePath, file.source)
  }
}

