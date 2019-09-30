const { execSync } = require('child_process')
const LRU = require('lru-cache')

// Package manager

/**
 * Check if a folder or any of its parents uses npm
 * @param {string} cwd
 */
exports.useNpm = function (cwd) {
  const findUp = require('find-up')
  try {
    return findUp.sync('package-lock.json', { cwd }) != null
  } catch (e) {
    return false
  }
}

/**
 * Check if a folder or any of its parents uses yarn
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
 * Check if a folder or any of its parents uses pnpm
 * @param {string} cwd
 */
exports.usePnpm = function (cwd) {
  const findUp = require('find-up')
  try {
    return findUp.sync('pnpm-lock.yaml', { cwd }) != null
  } catch (e) {
    return false
  }
}

/**
 * Return which package manager a folder or its parents use
 * @param {string} cwd
 */
exports.getPkgCommand = function (cwd) {
  if (exports.useYarn(cwd)) {
    return 'yarn'
  }
  if (exports.usePnpm(cwd)) {
    return 'pnpm'
  }
  return 'npm'
}

// Git

let _hasGit
const _gitProjects = new LRU({
  max: 10,
  maxAge: 1000,
})

exports.isGitInstalled = () => {
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

exports.isFolderUsingGit = (cwd) => {
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

// OS

exports.isWindows = process.platform === 'win32'
exports.isMacintosh = process.platform === 'darwin'
exports.isLinux = process.platform === 'linux'
