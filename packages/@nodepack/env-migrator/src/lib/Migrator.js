module.exports = class Migrator {
  constructor (cwd, {
    plugins = [],
    completeCbs = [],
  } = {}) {
    this.cwd = cwd
    this.plugins = plugins
    this.completeCbs = completeCbs

    this.migratePrepared = false
    this.rollbackPrepared = false

    /** @type {Migration []} */
    this.migrations = []
    /** @type {Migration []} */
    this.queuedMigrations = []
    /** @type {MigrationRecord []} */
    this.migrationRecords = []
    /** @type {Map<string, boolean>} */
    this.migratedIds = new Map()
    /** @type {Notice []} */
    this.notices = []
  }
}
