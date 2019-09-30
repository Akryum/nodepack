const { isGitInstalled, isFolderUsingGit } = require('./env')
const { run } = require('./run')

/**
 * @param {string} cwd
 * @param {any} cliOptions
 * @param {boolean} isTestOrDebug
 * @param {string} defaultMessage
 */
exports.commitOnGit = async function (cwd, cliOptions, isTestOrDebug, defaultMessage) {
  let success = true
  await run(cwd, 'git add -A')
  if (isTestOrDebug) {
    await run(cwd, 'git', ['config', 'user.name', 'test'])
    await run(cwd, 'git', ['config', 'user.email', 'test@test.com'])
  }
  const message = typeof cliOptions.git === 'string' ? cliOptions.git : defaultMessage
  let error = null
  try {
    await run(cwd, 'git', ['commit', '-m', message])
  } catch (e) {
    error = e
    success = false
  }
  return {
    success,
    message,
    error,
  }
}

/**
 * @param {string} cwd
 * @param {any} cliOptions
 */
exports.shouldUseGit = async function (cwd, cliOptions) {
  if (!isGitInstalled()) {
    return false
  }
  // --git
  if (cliOptions.forceGit) {
    return true
  }
  // --no-git
  if (cliOptions.git === false || cliOptions.git === 'false') {
    return false
  }
  return !isFolderUsingGit(cwd)
}

/**
 * @param {string} cwd
 * @param {boolean} cached
 */
exports.hasGitChanges = async function (cwd, cached) {
  const { stdout } = await run(cwd, `git diff${cached ? ' --cached' : ''}`)
  return !!stdout
}
