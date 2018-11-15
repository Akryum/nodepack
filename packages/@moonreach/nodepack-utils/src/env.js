/**
 * @param {string} cwd
 */
exports.useYarn = function (cwd) {
  const findUp = require('find-up')
  try {
    return findUp.sync('yarn.lock', { cwd }) != null
  } catch (e) {
    return false
  }
}

/**
 * @param {string} cwd
 */
exports.getPkgCommand = function (cwd) {
  return exports.useYarn(cwd) ? 'yarn' : 'npm'
}
