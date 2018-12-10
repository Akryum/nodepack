/** @typedef {import('./Service.js').ProjectOptions} ProjectOptions */
/** @typedef {import('../../types/ServicePlugin').ServicePlugin} PluginApply */

module.exports = class ServicePlugin {
  /**
   * @param {string} id
   * @param {PluginApply} apply
   */
  constructor (id, apply) {
    this.id = id
    this.apply = apply
  }
}
