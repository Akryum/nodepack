/**
 * @param {string} file
 */
exports.loadFragment = (file, cwd = process.cwd()) => {
  const { loadModule } = require('@nodepack/module')
  const path = require('path')
  const outputDir = process.env.NODEPACK_DIRNAME || getOutputConfig(cwd) || process.cwd()
  const moduleFile = path.join(outputDir, file)
  return loadModule(moduleFile, outputDir)
}

function getOutputConfig (cwd) {
  const { readConfigFileSync } = require('./configFiles')
  const config = readConfigFileSync(cwd, 'config.json')
  return config.output
}
