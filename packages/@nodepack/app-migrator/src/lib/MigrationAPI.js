/** @typedef {import('../../types/MigrationOptions').MigrationOptions} MigrationOptions */
/** @typedef {import('./Migrator')} Migrator */
/** @typedef {import('./MigratorPlugin')} MigratorPlugin */

const { hasPlugin } = require('../util/plugins')

module.exports = class MigrationAPI {
  /**
   * @param {MigratorPlugin} plugin
   * @param {Migrator} migrator
   */
  constructor (plugin, migrator) {
    this.plugin = plugin
    this.migrator = migrator
  }

  /**
   * Register a migration that may be run during plugin install or dev build.
   *
   * @param {MigrationOptions} options
   */
  register (options) {
    this.migrator.migrations.push({
      plugin: this.plugin,
      options,
    })
  }

  /**
   * Called once after all migration operations are completed.
   *
   * @param {function} cb
   */
  onComplete (cb) {
    this.migrator.completeCbs.push(cb)
  }

  /**
   * Check if the project has a plugin installed
   * @param {string} id Plugin id
   */
  hasPlugin (id) {
    return hasPlugin(id, this.migrator.plugins, this.migrator.pkg)
  }
}
