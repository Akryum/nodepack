const path = require('path')
const fs = require('fs-extra')
const { readPkg } = require('@nodepack/utils')

module.exports = function (cwd) {
  return fs.existsSync(path.resolve(cwd, '.nodepack')) ||
    fs.existsSync(path.resolve(cwd, 'nodepack.config.js')) ||
    hasDependency(cwd, '@nodepack/service')
}

function hasDependency (cwd, id) {
  const pkg = readPkg(cwd)
  return pkg && (pkg.dependencies[id] || pkg.devDependencies[id])
}
