const path = require('path')
const fs = require('fs-extra')
const { sortObject } = require('./object')
const { request } = require('./request')
const shouldUseTaobao = require('./shouldUseTaobao')

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

exports.getPackageMetadata = async function (id, range = '') {
  const registry = (await shouldUseTaobao())
    ? `https://registry.npm.taobao.org`
    : `https://registry.npmjs.org`

  let result
  try {
    result = await request.get(`${registry}/${encodeURIComponent(id).replace(/^%40/, '@')}/${range}`)
  } catch (e) {
    return e
  }
  return result
}

/**
 * @param {string} id Package id
 * @param {string} tag Release tag
 * @returns {Promise.<string?>}
 */
exports.getPackageTaggedVersion = async function (id, tag = 'latest') {
  try {
    const res = await exports.getPackageMetadata(id)
    return res.body['dist-tags'][tag]
  } catch (e) {
    return null
  }
}
