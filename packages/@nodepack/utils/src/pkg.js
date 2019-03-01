const path = require('path')
const fs = require('fs-extra')
const { sortObject } = require('./object')

/**
 * Read the package.json file of a project folder.
 * @param {string} cwd Project folder.
 */
exports.readPkg = cwd => {
  const pkgFile = path.resolve(cwd, 'package.json')
  if (fs.existsSync(pkgFile)) {
    const pkg = fs.readJSONSync(pkgFile)
    if (!pkg.dependencies) pkg.dependencies = {}
    if (!pkg.devDependencies) pkg.devDependencies = {}
    return pkg
  }
  return null
}

/**
 * Write the package.json file of a project folder.
 * @param {string} cwd Project folder.
 * @param {any} data Object
 */
exports.writePkg = (cwd, data) => {
  const pkgFile = path.resolve(cwd, 'package.json')
  fs.writeJsonSync(pkgFile, data, {
    spaces: 2,
  })
}

/**
 * Sort package data fields.
 * @param {any} pkg Data from a package.json file.
 */
exports.sortPkg = pkg => {
  // ensure package.json keys has readable order
  pkg.dependencies = sortObject(pkg.dependencies)
  pkg.devDependencies = sortObject(pkg.devDependencies)
  pkg.scripts = sortObject(pkg.scripts, [
    'dev',
    'build',
    'test',
    'e2e',
    'lint',
    'deploy',
  ])
  pkg = sortObject(pkg, [
    'name',
    'version',
    'private',
    'description',
    'author',
    'scripts',
    'dependencies',
    'devDependencies',
    'nodepack',
    'babel',
    'eslintConfig',
    'prettier',
    'jest',
  ])
  return pkg
}

exports.pkgNameRegEx = /^(@[^\\\/]+[\\\/])?[^\\\/]+/
