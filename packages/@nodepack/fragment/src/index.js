/**
 * @param {string} file
 */
exports.loadFragment = (file) => {
  const { loadModule } = require('@nodepack/module')
  const path = require('path')
  const cwd = process.env.NODEPACK_DIRNAME || getOutputConfig() || process.cwd()
  const moduleFile = path.join(cwd, file)
  return loadModule(moduleFile, cwd)
}

function getOutputConfig () {
  const { readConfigFileSync } = require('./configFiles')
  const config = readConfigFileSync(process.cwd(), 'config.json')
  return config.output
}
