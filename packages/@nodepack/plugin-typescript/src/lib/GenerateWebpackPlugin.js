/** @typedef {import('@nodepack/service').ServicePluginAPI} ServicePluginAPI */
/** @typedef {import('@nodepack/service').ProjectOptions} ProjectOptions */
/** @typedef {import('webpack').Compiler} Compiler */

const { generateContext } = require('./generate-context')
const { generateConfig } = require('./generate-config')

module.exports = class GenerateWebpackPlugin {
  /**
   * @param {ServicePluginAPI} api
   * @param {ProjectOptions} options
   */
  constructor (api, options) {
    this.api = api
    this.options = options
  }

  /**
   * @param {Compiler} compiler
   */
  apply (compiler) {
    compiler.hooks.beforeCompile.tapAsync('@nodepack/plugin-ts/generate', async (params, callback) => {
      await generateContext(this.api, this.options)
      await generateConfig(this.api, this.options)
      callback()
    })
  }
}
