const DEFAULT_ENTRY = 'index.js'

/**
 * @param {string} folder
 * @returns {string}
 */
exports.getDefaultEntry = (folder) => {
  const { readPackageJson } = require('./pkgJson')
  const pkg = readPackageJson(folder)
  if (pkg && pkg.main) {
    return pkg.main
  }
  return DEFAULT_ENTRY
}
