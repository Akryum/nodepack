/** @typedef {import('./Migrator')} Migrator */
/** @typedef {import('./MigratorPlugin')} MigratorPlugin */

const { resolveFile } = require('../util/files')
const semver = require('semver')

module.exports = class MigrationWhenAPI {
  /**
   * @param {MigratorPlugin} plugin
   * @param {Migrator} migrator
   */
  constructor (plugin, migrator, {
    pkg,
  }) {
    this.plugin = plugin
    this.migrator = migrator
    this.pkg = pkg
  }

  /**
   * Current working directory.
   */
  get cwd () {
    return this.migrator.cwd
  }

  /**
   * Resolve path in the project.
   *
   * @param {string} filePath - Relative path from project root
   * @return {string} The resolved absolute path.
   */
  resolve (filePath) {
    return resolveFile(this.cwd, filePath)
  }

  /**
   * Test if the previous migrated version of the plugin satisfies a version range.
   *
   * @param {string} versionRange
   */
  fromVersion (versionRange) {
    if (!this.plugin.previousVersion) return false
    return semver.satisfies(this.plugin.previousVersion, versionRange)
  }

  /**
   * Test if the current version of the plugin satisfies a version range.
   *
   * @param {string} versionRange
   */
  toVersion (versionRange) {
    if (!this.plugin.previousVersion) return false
    return semver.satisfies(this.plugin.previousVersion, versionRange)
  }

  /**
   * Is the plugin installed for the first time in the project?
   */
  get isFirstInstall () {
    return this.plugin.isFirstInstall
  }
}
