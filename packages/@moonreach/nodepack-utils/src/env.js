const { execSync } = require('child_process')
const LRU = require('lru-cache')

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

let _hasGit
const _gitProjects = new LRU({
  max: 10,
  maxAge: 1000,
})

exports.hasGit = () => {
  if (process.env.NODEPACK_TEST) {
    return true
  }
  if (_hasGit != null) {
    return _hasGit
  }
  try {
    execSync('git --version', { stdio: 'ignore' })
    return (_hasGit = true)
  } catch (e) {
    return (_hasGit = false)
  }
}

exports.hasProjectGit = (cwd) => {
  if (_gitProjects.has(cwd)) {
    return _gitProjects.get(cwd)
  }

  let result
  try {
    execSync('git status', { stdio: 'ignore', cwd })
    result = true
  } catch (e) {
    result = false
  }
  _gitProjects.set(cwd, result)
  return result
}
