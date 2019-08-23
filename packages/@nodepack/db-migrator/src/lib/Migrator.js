/**
 * @typedef FileMigrationRecord
 * @prop {string} file
 * @prop {string} date
 */

const { Migrator: EnvMigrator } = require('@nodepack/env-migrator')

module.exports = class Migrator extends EnvMigrator {
  /**
   * @private
   */
  async setup () {
    await this.readMigrationRecords()
  }

  /**
   * @private
   */
  async readMigrationRecords () {
    if (!this.context.readDbMigrationRecords) {
      throw new Error(`No 'readDbMigrationRecords' method provided by context`)
    }
    const data = await this.context.readDbMigrationRecords()
    this.fileMigrationRecords = data.files
  }

  /**
   * @private
   */
  async writeMigrationRecords () {
    if (!this.context.writeDbMigrationRecords) {
      throw new Error(`No 'writeDbMigrationRecords' method provided by context`)
    }
    await this.context.writeDbMigrationRecords({
      files: this.fileMigrationRecords,
      plugins: [],
    })
  }
}
