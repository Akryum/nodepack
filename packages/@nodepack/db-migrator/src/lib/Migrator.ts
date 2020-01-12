import { Migrator as EnvMigrator } from '@nodepack/env-migrator'
import consola from 'consola'

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
    try {
      if (!this.context.readDbMigrationRecords) {
        throw new Error(`No 'readDbMigrationRecords' method provided by context`)
      }
      const data = await this.context.readDbMigrationRecords()
      this.fileMigrationRecords = data.files
    } catch (e) {
      consola.error('Could not read migration records. Error:', e.stack || e)
      this.fileMigrationRecords = []
    }
  }

  /**
   * @private
   */
  async writeMigrationRecords () {
    try {
      if (!this.context.writeDbMigrationRecords) {
        throw new Error(`No 'writeDbMigrationRecords' method provided by context`)
      }
      await this.context.writeDbMigrationRecords({
        files: this.fileMigrationRecords,
        plugins: [],
      })
    } catch (e) {
      consola.error('Could not write migration records. Error:', e.stack || e)
    }
  }
}
