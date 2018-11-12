/** @typedef {import('./PackPluginAPI.js')} PackPluginApi */
/** @typedef {import('./PackService.js').ProjectOptions} ProjectOptions */
/**
 * @typedef {(api?: PackPluginApi, options?: ProjectOptions) => void} PackPluginApply
 * @prop {Object.<string, string>} [defaultEnvs]
 */

module.exports = class PackPlugin {
  /**
   * @param {string} id
   * @param {PackPluginApply} apply
   */
  constructor (id, apply) {
    this.id = id
    this.apply = apply
  }
}
