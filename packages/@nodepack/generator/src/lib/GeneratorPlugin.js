/** @typedef {import('@nodepack/service').GeneratorPluginApply} GeneratorPluginApply */
/** @typedef {import('./Generator.js').ProjectOptions} ProjectOptions */

module.exports = class GeneratorPlugin {
  /**
   * @param {string} id
   * @param {GeneratorPluginApply} apply
   */
  constructor (id, apply) {
    this.id = id
    this.apply = apply
  }
}
