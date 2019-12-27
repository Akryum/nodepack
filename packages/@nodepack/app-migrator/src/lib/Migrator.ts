// API
import { MigrationAPI } from './MigrationAPI'
import { MigrationWhenAPI } from './MigrationWhenAPI'
import { MigrationOperation } from './MigrationOperation'
// Utils
import chalk from 'chalk'
import {
  toShortPluginId,
  isPlugin,
} from '@nodepack/plugins-resolution'
import {
  logWithSpinner,
  stopSpinner,
  ensureConfigFile,
  readConfigFile,
  writeConfigFile,
  readPkg,
  FILE_APP_MIGRATIONS_PLUGIN_VERSIONS,
  FILE_APP_MIGRATIONS_RECORDS,
  Preset,
} from '@nodepack/utils'
import consola from 'consola'
import inquirer from 'inquirer'
import { getVersion, hasPlugin } from '../util/plugins'
import { printNoRollbackWarn } from '../util/printNoRollbackWarn'
import { MigrationPlugin } from './MigrationPlugin'
import { MigrationOptions } from './MigrationOptions'

export type MigrationAllOptions = { [key: string]: { [key2: string]: any } }

export interface MigratorOptions {
  plugins?: MigrationPlugin[]
  completeCbs?: Function[]
}

export interface MigrationRecord {
  id: string
  pluginId: string
  pluginVersion: string
  options: any
  date: string
}

export interface Migration {
  plugin: MigrationPlugin
  options: MigrationOptions
}

export type NoticeType = 'info' | 'warn' | 'error' | 'done' | 'success' | 'log'

export interface Notice {
  pluginId: string
  type: NoticeType
  message: string
}

const logTypes = {
  log: consola.log,
  info: consola.info,
  done: consola.success,
  success: consola.success,
  warn: consola.warn,
  error: consola.error,
}

export class Migrator {
  cwd: string
  plugins: MigrationPlugin[]
  completeCbs: Function[]

  upPrepared = false
  downPrepared = false

  migrations: Migration[] = []
  queuedMigrations: Migration[] = []
  migrationRecords: MigrationRecord[] = []
  migratedIds: Map<string, boolean> = new Map()
  notices: Notice[] = []

  pkg: any

  constructor (cwd: string, {
    plugins = [],
    completeCbs = [],
  }: MigratorOptions = {}) {
    this.cwd = cwd
    this.plugins = plugins
    this.completeCbs = completeCbs
  }

  async prepareUp () {
    if (!this.upPrepared) {
      await this.setup()

      // Migrations that will be applied
      this.queuedMigrations = await this.resolveMigrations()

      this.upPrepared = true
    }

    return {
      migrations: this.queuedMigrations,
    }
  }

  async up (preset: Preset = null) {
    if (!this.upPrepared) {
      await this.prepareUp()
    }

    let options: MigrationAllOptions = null
    let extractConfigFiles = false

    if (preset) {
      extractConfigFiles = preset.useConfigFiles || false
      if (preset.appMigrations) {
        options = preset.appMigrations
      }
    }

    const migrations = this.queuedMigrations

    // Prompts
    const rootOptions = options || await this.resolvePrompts(migrations)

    let migrationCount = 0
    for (const migration of migrations) {
      // Prompts results
      const pluginOptions = rootOptions[migration.plugin.id]
      const migrationOptions = (pluginOptions && pluginOptions[migration.options.id]) || {}

      const operation = new MigrationOperation(this, migration, {
        options: migrationOptions,
        rootOptions,
      })

      logWithSpinner('✔️', `${chalk.grey(migration.plugin.id)} ${migration.options.title}`)

      try {
        await operation.run('up', {
          extractConfigFiles,
        })
      } catch (e) {
        consola.error(`An error occured while performing app migration: ${chalk.grey(migration.plugin.id)} ${chalk.bold(migration.options.title)}`)
        stopSpinner(false)
        console.error(e)
        process.exit(1)
      }

      stopSpinner()

      // Mark migration as completed
      this.migrationRecords.push({
        id: migration.options.id,
        pluginId: migration.plugin.id,
        pluginVersion: migration.plugin.currentVersion || '',
        options: operation.options,
        date: new Date().toISOString(),
      })

      migrationCount++
    }

    // Write config files
    await this.writeMigrationRecords()
    await this.writePluginVersions()

    await this.applyCompleteCbs()

    await this.displayNotices()

    return {
      allOptions: rootOptions,
      migrationCount,
    }
  }

  async prepareRollback (removedPlugins: string[]) {
    if (!this.downPrepared) {
      await this.setup()

      // Migrations that will be rollbacked
      this.queuedMigrations = await this.resolveRollbacks(removedPlugins)

      this.downPrepared = true
    }

    return {
      migrations: this.queuedMigrations,
    }
  }

  async down (removedPlugins: string[]) {
    if (!this.downPrepared) {
      await this.prepareRollback(removedPlugins)
    }

    const rootOptions = {}
    for (const record of this.migrationRecords) {
      const options = rootOptions[record.pluginId] = rootOptions[record.pluginId] || {}
      options[record.id] = record.options
    }

    let rollbackCount = 0
    for (const migration of this.queuedMigrations) {
      // Prompts results
      const pluginOptions = rootOptions[migration.plugin.id]
      const migrationOptions = (pluginOptions && pluginOptions[migration.options.id]) || {}

      const operation = new MigrationOperation(this, migration, {
        options: migrationOptions,
        rootOptions,
      })

      logWithSpinner('✔️', `${chalk.grey(migration.plugin.id)} ${migration.options.title}`)

      await operation.run('down', {
        extractConfigFiles: false,
      })

      stopSpinner()

      // Remove migration from records
      const index = this.migrationRecords.findIndex(m => m.id === migration.options.id && m.pluginId === migration.plugin.id)
      if (index !== -1) this.migrationRecords.splice(index, 1)

      rollbackCount++
    }

    // Write config files
    await this.writeMigrationRecords()
    await this.writePluginVersions(removedPlugins)

    await this.applyCompleteCbs()

    await this.displayNotices()

    return {
      allOptions: rootOptions,
      rollbackCount,
    }
  }

  /**
   * @private
   */
  async setup () {
    // Ensure the config files exists in '.nodepack' folder
    await ensureConfigFile(this.cwd, FILE_APP_MIGRATIONS_RECORDS, [])
    await ensureConfigFile(this.cwd, FILE_APP_MIGRATIONS_PLUGIN_VERSIONS, {})

    // Read package.json
    this.pkg = readPkg(this.cwd)

    // Register the migrations
    await this.applyPlugins()

    await this.readMigrationRecords()
    await this.readPluginVersions()
  }

  /**
   * @private
   */
  async applyPlugins () {
    for (const plugin of this.plugins) {
      await plugin.apply(new MigrationAPI(plugin, this))
    }
  }

  /**
   * @private
   */
  async readMigrationRecords () {
    this.migrationRecords = await readConfigFile(this.cwd, FILE_APP_MIGRATIONS_RECORDS)
    // Cache ids
    for (const record of this.migrationRecords) {
      this.migratedIds.set(`${record.pluginId}${record.id}`, true)
    }
  }

  /**
   * @private
   */
  async writeMigrationRecords () {
    await writeConfigFile(this.cwd, FILE_APP_MIGRATIONS_RECORDS, this.migrationRecords)
  }

  /**
   * @private
   */
  async resolveMigrations (): Promise<Migration[]> {
    const list: Migration[] = []
    for (const migration of this.migrations) {
      // Skip if migration already applied
      if (this.migratedIds.get(`${migration.plugin.id}${migration.options.id}`)) {
        continue
      }

      // Migration requires plugins
      if (migration.options.requirePlugins && !migration.options.requirePlugins.every(
        id => hasPlugin(id, this.plugins, this.pkg),
      )) {
        continue
      }

      // Custom condition
      if (migration.options.when) {
        const whenApi = new MigrationWhenAPI(migration.plugin, this, {
          pkg: this.pkg,
        })
        const result = await migration.options.when(whenApi)
        if (!result) {
          continue
        }
      }

      if (!migration.options.down) {
        printNoRollbackWarn(migration)
      }

      list.push(migration)
    }
    return list
  }

  /**
   * @private
   */
  async resolveRollbacks (removedPlugins: string[]) {
    const list: Migration[] = []
    for (const migration of this.migrations) {
      // Skip if the migration wasn't applied
      if (!this.migratedIds.get(`${migration.plugin.id}${migration.options.id}`)) {
        continue
      }

      // We rollback has soon has one of the required plugins is removed
      if (migration.options.requirePlugins && migration.options.requirePlugins.some(
        id => removedPlugins.includes(id),
      )) {
        list.push(migration)
        continue
      }

      if (removedPlugins.includes(migration.plugin.id)) {
        list.push(migration)
      }
    }
    return list.filter(migration => {
      // Skip if no rollback was defined
      if (!migration.options.down) {
        printNoRollbackWarn(migration)
        return false
      }
      return true
    })
  }

  async resolvePrompts (migrations: Migration[]) {
    const rootOptions: MigrationAllOptions = {}
    for (const migration of migrations) {
      if (migration.options.prompts) {
        // Prompts
        const prompts = await migration.options.prompts(rootOptions)
        if (!prompts.length) continue

        // Answers
        let options = rootOptions[migration.plugin.id]
        if (!options) {
          options = rootOptions[migration.plugin.id] = {}
        }
        consola.log(chalk.grey(`${migration.plugin.id} is prompting:`))
        let answers = await inquirer.prompt(prompts)
        // Check if answers are seriazable
        try {
          const oldAnswers = answers
          answers = JSON.parse(JSON.stringify(answers))
          if (Object.keys(answers).length !== Object.keys(oldAnswers).length) {
            throw new Error(`Missing answers`)
          }
        } catch (e) {
          consola.error(`Answers are not serializable into JSON for plugin ${migration.plugin.id} migration ${migration.options.id}`)
        }
        options[migration.options.id] = answers
      }
    }
    return rootOptions
  }

  /**
   * Read the current and previous versions of plugins.
   *
   * @private
   */
  async readPluginVersions () {
    const pluginVersions = await readConfigFile(this.cwd, FILE_APP_MIGRATIONS_PLUGIN_VERSIONS)
    for (const plugin of this.plugins) {
      plugin.currentVersion = getVersion(plugin.id, this.cwd)
      plugin.previousVersion = pluginVersions[plugin.id]
    }
  }

  /**
   * Write the current versions of plugins
   * into the 'plugin-versions.json' config file.
   *
   * @private
   */
  async writePluginVersions (removedPlugins: string[] = []) {
    const result = {}
    for (const plugin of this.plugins) {
      if (!removedPlugins.includes(plugin.id)) {
        result[plugin.id] = plugin.currentVersion
      }
    }

    // Plugins without migrations
    // should also have their version saved
    const deps = {
      ...this.pkg.dependencies,
      ...this.pkg.devDependencies,
    }
    for (const id in deps) {
      if (!result[id] && isPlugin(id) && !removedPlugins.includes(id)) {
        result[id] = getVersion(id, this.cwd)
      }
    }

    await writeConfigFile(this.cwd, FILE_APP_MIGRATIONS_PLUGIN_VERSIONS, result)
  }

  /**
   * @private
   */
  async applyCompleteCbs () {
    for (const cb of this.completeCbs) {
      await cb()
    }
  }

  /**
   * @private
   */
  async displayNotices () {
    if (this.notices.length) {
      this.notices.forEach(({ pluginId, message, type }) => {
        const shortId = toShortPluginId(pluginId)
        const logFn = logTypes[type]
        if (!logFn) {
          consola.error(`Invalid api.addNotice type '${type}'.`, shortId)
        } else {
          const tag = message ? shortId : null
          logFn(message, tag)
        }
      })
      consola.log('')
    }
  }
}
