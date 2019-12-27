import { hasPlugin } from '../util/plugins'
import { MigrationOptions } from './MigrationOptions'
import { Migrator } from './Migrator'
import { MigrationPlugin } from './MigrationPlugin'

export class MigrationAPI {
  plugin: MigrationPlugin
  migrator: Migrator

  constructor (plugin: MigrationPlugin, migrator: Migrator) {
    this.plugin = plugin
    this.migrator = migrator
  }

  /**
   * Register a migration that may be run during plugin install or dev build.
   */
  register (options: MigrationOptions) {
    this.migrator.migrations.push({
      plugin: this.plugin,
      options,
    })
  }

  /**
   * Called once after all migration operations are completed.
   */
  onComplete (cb: Function) {
    this.migrator.completeCbs.push(cb)
  }

  /**
   * Check if the project has a plugin installed
   * @param id Plugin id
   */
  hasPlugin (id: string) {
    return hasPlugin(id, this.migrator.plugins, this.migrator.pkg)
  }
}
