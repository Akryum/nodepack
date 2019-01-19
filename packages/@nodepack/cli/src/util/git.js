const {
  hasGit,
  hasProjectGit,
} = require('@nodepack/utils')

/**
 * @param {any} cliOptions
 * @param {boolean} isTestOrDebug
 * @returns {Promise.<boolean>} Git commit success
 */
exports.commitOnGit = async function (cliOptions, isTestOrDebug) {
  const { run } = this
  let success = true
  await run('git add -A')
  if (isTestOrDebug) {
    await run('git', ['config', 'user.name', 'test'])
    await run('git', ['config', 'user.email', 'test@test.com'])
  }
  const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
  try {
    await run('git', ['commit', '-m', msg])
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
