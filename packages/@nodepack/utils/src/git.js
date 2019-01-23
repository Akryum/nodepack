const { hasGit, hasProjectGit } = require('./env')
const { run } = require('./run')

/**
 * @param {string} cwd
 * @param {any} cliOptions
 * @param {boolean} isTestOrDebug
 * @param {string} defaultMessage
 * @returns {Promise.<boolean>} Git commit success
 */
exports.commitOnGit = async function (cwd, cliOptions, isTestOrDebug, defaultMessage) {
  let success = true
  await run(cwd, 'git add -A')
  if (isTestOrDebug) {
    await run(cwd, 'git', ['config', 'user.name', 'test'])
    await run(cwd, 'git', ['config', 'user.email', 'test@test.com'])
  }
  const msg = typeof cliOptions.git === 'string' ? cliOptions.git : defaultMessage
  try {
    await run(cwd, 'git', ['commit', '-m', msg])
  } catch (e) {
    success = false
  }
  return success
}

/**
 * @param {string} cwd
 * @param {any} cliOptions
 */
exports.shouldUseGit = async function (cwd, cliOptions) {
  if (!hasGit()) {
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
  // default: true unless already in a git repo
  return !hasProjectGit(cwd)
}
