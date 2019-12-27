import chalk from 'chalk'
import { findMigrations, loadMigrations, Module } from '../util/loadMigrationFolder'
import {
  logWithSpinner,
  stopSpinner,
  ensureConfigFile,
  readConfigFile,
  writeConfigFile,
  FILE_ENV_MIGRATIONS_RECORDS,
} from '@nodepack/utils'
import consola from 'consola'

export interface FileMigrationRecord {
  file: string
  date: string
}

export interface MigratorOptions {
  migrationsFolder: string
}

export interface RunOptions {
  context: any
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpOptions extends RunOptions {
}

export class Migrator {
  cwd: string
  migrationsFolder: string
  context: any
  fileMigrationRecords: FileMigrationRecord[] = []
  upPrepared = false
  modules: Module[]

  constructor (cwd: string, {
    migrationsFolder,
  }: MigratorOptions) {
    this.cwd = cwd
    this.migrationsFolder = migrationsFolder
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

  async up ({
    context,
  }: UpOptions) {
    await this.prepareUp()

    this.context = context

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
