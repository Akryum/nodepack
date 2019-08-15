/**
 * @param {string} file
 */
exports.loadFragment = (file) => {
  const { loadModule } = require('@nodepack/module')
  // const { readConfigFileSync } = require('./configFiles')
  const path = require('path')

  // const config = readConfigFileSync(process.cwd(), 'config.json')

  // const cwd = config.output || process.env.NODEPACK_DIRNAME || process.cwd()
  const cwd = process.env.NODEPACK_DIRNAME || process.cwd()
  const moduleFile = path.join(cwd, file)

  return loadModule(moduleFile, cwd)
}
