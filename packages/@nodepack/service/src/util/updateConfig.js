const { readConfigFile, writeConfigFile } = require('@nodepack/utils')

/**
 * @param {string} cwd
 * @param {any} data
 */
exports.updateConfig = async (cwd, data) => {
  const existingData = await readConfigFile(cwd, 'config.json')
  Object.assign(existingData, data)
  await writeConfigFile(cwd, 'config.json', JSON.stringify(existingData, null, 2))
}
