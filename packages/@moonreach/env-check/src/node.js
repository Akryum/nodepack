/**
 * @param {string} id
 * @param {string} wanted
 */
exports.checkNode = function (id, wanted, exit = true) {
  const { default: chalk } = require('chalk')
  const semver = require('semver')

  if (!semver.satisfies(process.version, wanted)) {
    console.log(chalk.red(
      'You are using Node ' + process.version + ', but this version of ' + id +
      ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
    ))
    if (exit) process.exit(1)
  }
}
