const path = require('path')
const fs = require('fs-extra')
const { sortObject } = require('@nodepack/utils')

/**
 * Read the package.json file of a project folder.
 * @param {string} cwd Project folder.
 */
exports.readPkg = cwd => {
  const pkg = fs.readJSONSync(path.join(cwd, 'package.json'))
  if (!pkg.dependencies) pkg.dependencies = {}
  if (!pkg.devDependencies) pkg.devDependencies = {}
  return pkg
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
