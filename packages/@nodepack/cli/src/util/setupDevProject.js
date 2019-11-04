// dev only

const path = require('path')
const { linkBin } = require('./linkBin')

/**
 * @param {string} targetDir
 */
module.exports = function setupDevProject (targetDir) {
  return linkBin(
    require.resolve('@nodepack/service/src/bin/nodepack-service'),
    path.join(targetDir, 'node_modules', '.bin', 'nodepack-service'),
  )
}
