/**
 * @param {string} folder
 */
exports.readPackageJson = (folder) => {
  const fs = require('fs-extra')
  const path = require('path')
  const pkgFile = path.resolve(folder, 'package.json')
  if (fs.existsSync(pkgFile)) {
    return fs.readJsonSync(pkgFile)
  }
  return null
}
