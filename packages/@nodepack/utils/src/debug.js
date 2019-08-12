/**
 * @param {string} targetDir
 */
exports.checkDebug = function (targetDir) {
  const fs = require('fs')
  const path = require('path')
  const slash = require('slash')
  const { info } = require('./logger')
  // enter debug mode when creating test repo
  if (
    slash(targetDir).indexOf('/packages/test') > 0 && (
      fs.existsSync(path.resolve(targetDir, '../@nodepack')) ||
      fs.existsSync(path.resolve(targetDir, '../../@nodepack'))
    )
  ) {
    // @ts-ignore
    process.env.NODEPACK_DEBUG = true
    info('🐛️  Debug mode enabled')
  }
}
