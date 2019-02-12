/** @typedef {import('../../types/MigrationPlugin').MigrationPlugin} MigrationPlugin */

module.exports = class MigratorPlugin {
  /**
   * @param {string} id
   * @param {MigrationPlugin} apply
   */
  constructor (id, apply) {
    this.id = id
    this.apply = apply
  }
}
