import { resolveFile } from '../util/files'
import semver from 'semver'
import { MigrationPlugin } from './MigrationPlugin'
import { Migrator } from './Migrator'

export interface MigrationWhenAPIOptions {
  pkg: any
}

export class MigrationWhenAPI {
  plugin: MigrationPlugin
  migrator: Migrator
  pkg: any

  constructor (plugin: MigrationPlugin, migrator: Migrator, {
    pkg,
  }: MigrationWhenAPIOptions) {
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
   * @param filePath - Relative path from project root
   * @return The resolved absolute path.
   */
  resolve (filePath: string) {
    return resolveFile(this.cwd, filePath)
  }

  /**
   * Test if the previous migrated version of the plugin satisfies a version range.
   */
  fromVersion (versionRange: string) {
    if (!this.plugin.previousVersion) return false
    return semver.satisfies(this.plugin.previousVersion, versionRange)
  }

  /**
   * Test if the current version of the plugin satisfies a version range.
   */
  toVersion (versionRange: string) {
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
