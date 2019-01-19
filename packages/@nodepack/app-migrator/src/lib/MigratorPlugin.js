/** @typedef {import('../../types/MigrationPlugin').MigrationPlugin} MigrationPlugin */
/** @typedef {import('./Migrator.js').ProjectOptions} ProjectOptions */

module.exports = class MigratorPlugin {
  /**
   * @param {string} id
   * @param {MigrationPlugin} apply
   */
  constructor (id, apply) {
    this.id = id
    this.apply = apply
    /** @type {string?} */
    this.currentVersion = null
    /** @type {string?} */
    this.previousVersion = null
  }

  get isFirstInstall () {
    return this.previousVersion == null
  }
}
