/** @typedef {import('../../types/MigrationPlugin').MigrationPlugin} MigrationPlugin */
/** @typedef {import('./Migrator.js').ProjectOptions} ProjectOptions */

module.exports = class MigratorPlugin {
  /**
   * @param {string} id
   * @param {MigrationPlugin} apply
   * @param {Object.<string, any>?} options Pre-defined options for the plugin migrations.
   */
  constructor (id, apply, options = null) {
    this.id = id
    this.apply = apply
    /** @type {string?} */
    this.currentVersion = null
    /** @type {string?} */
    this.previousVersion = null
    this.options = options
  }

  get isFirstInstall () {
    return this.previousVersion == null
  }
}
