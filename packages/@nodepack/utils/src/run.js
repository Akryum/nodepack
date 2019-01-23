const execa = require('execa')

exports.run = function (cwd, command, args) {
  if (!args) { [command, ...args] = command.split(/\s+/) }
  return execa(command, args, { cwd })
}
