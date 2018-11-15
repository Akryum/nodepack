/** @typedef {import('./PackPluginAPI.js')} PackPluginApi */
/** @typedef {import('./PackService.js').ProjectOptions} ProjectOptions */
/** @typedef {import('../../types/PackPlugin').PackPluginApply} PackPluginApply */

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
