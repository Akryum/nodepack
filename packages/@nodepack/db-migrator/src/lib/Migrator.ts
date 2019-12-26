import { Migrator as EnvMigrator } from '@nodepack/env-migrator'

export interface FileMigrationRecord {
  file: string
  date: string
}

export class Migrator extends EnvMigrator {
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
