const execa = require('execa')

/**
 * @param {string} cwd
 * @param {string} command
 * @param {string[]?} [args]
 */
exports.run = function (cwd, command, args = null) {
  if (!args) { [command, ...args] = command.split(/\s+/) }
  return execa(command, args, { cwd })
}
