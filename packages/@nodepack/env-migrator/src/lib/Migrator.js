/**
 * @typedef FileMigrationRecord
 * @prop {string} file
 * @prop {string} date
 */

const chalk = require('chalk')
const { findMigrations, loadMigrations } = require('../util/loadMigrationFolder')
const {
  logWithSpinner,
  stopSpinner,
  ensureConfigFile,
  readConfigFile,
  writeConfigFile,
  FILE_ENV_MIGRATIONS_RECORDS,
} = require('@nodepack/utils')
const consola = require('consola')

module.exports = class Migrator {
  /**
   * @param {string} cwd
   */
  constructor (cwd, {
    migrationsFolder,
    context,
  }) {
    this.cwd = cwd
    this.migrationsFolder = migrationsFolder
    this.context = context
    /** @type {FileMigrationRecord[]} */
    this.fileMigrationRecords = []
    this.upPrepared = false
  }

  async prepareUp () {
    if (!this.upPrepared) {
      await this.setup()

      let files = await findMigrations(this.cwd, this.migrationsFolder)
      files = files.filter(file => !this.fileMigrationRecords.find(record => record.file === file))
      this.modules = await loadMigrations(this.cwd, files)

      this.upPrepared = true
    }

    return {
      files: this.modules,
    }
  }

  async up () {
    await this.prepareUp()

    // Files
    let count = 0
    for (const module of this.modules) {
      if (module.up) {
        try {
          logWithSpinner('✔️', chalk.grey(module.file))
          await module.up(this.context)
          stopSpinner()
          this.fileMigrationRecords.push({
            file: module.file,
            date: new Date().toISOString(),
          })
          count++
        } catch (e) {
          consola.error(`Migration failed for ${module.file}\n${e.stack || e.message}`)
          await this.writeMigrationRecords()
          process.exit(1)
        }
      }
    }

    await this.writeMigrationRecords()

    return {
      migrationCount: count,
    }
  }

  /**
   * @private
   */
  async setup () {
    // Ensure the config files exists in '.nodepack' folder
    await ensureConfigFile(this.cwd, FILE_ENV_MIGRATIONS_RECORDS, {
      files: [],
      plugins: [],
    })

    await this.readMigrationRecords()
  }

  /**
   * @private
   */
  async readMigrationRecords () {
    const data = await readConfigFile(this.cwd, FILE_ENV_MIGRATIONS_RECORDS)
    this.fileMigrationRecords = data.files
  }

  /**
   * @private
   */
  async writeMigrationRecords () {
    await writeConfigFile(this.cwd, FILE_ENV_MIGRATIONS_RECORDS, {
      files: this.fileMigrationRecords,
      plugins: [],
    })
  }
}
