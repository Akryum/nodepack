const path = require('path')
const fs = require('fs-extra')

module.exports = function (cwd) {
  return fs.existsSync(path.resolve(cwd, '.nodepack')) || fs.existsSync(path.resolve(cwd, 'nodepack.config.js'))
}
