/** @typedef {import('@nodepack/service').ProjectOptions} ProjectOptions */
/** @typedef {import('./MigratorPlugin')} MigratorPlugin */
/** @typedef {import('../../types/MigrationOptions').MigrationOptions} MigrationOptions */
/** @typedef {import('@nodepack/utils').Preset} Preset */

/** @typedef {Object.<string, Object.<string, any>>} MigrationAllOptions */

/**
 * @typedef MigratorOptions
 * @prop {MigratorPlugin []} [plugins]
 * @prop {function []} [completeCbs]
 */

/**
 * @typedef MigrationRecord
 * @prop {string} id
 * @prop {string} pluginId
 * @prop {string} pluginVersion
 * @prop {ProjectOptions} options
 * @prop {string} date
 */

/**
 * @typedef Migration
 * @prop {MigratorPlugin} plugin
 * @prop {MigrationOptions} options
 */

/** @typedef {'info'|'warn'|'error'|'done'|'log'} NoticeType */

/**
 * @typedef Notice
 * @prop {string} pluginId
 * @prop {NoticeType} type
 * @prop {string} message
 */

// API
const MigrationAPI = require('./MigrationAPI')
const MigrationWhenAPI = require('./MigrationWhenAPI')
const MigrationOperation = require('./MigrationOperation')
// Utils
const {
  toShortPluginId,
  isPlugin,
} = require('@nodepack/plugins-resolution')
const {
  log,
  info,
  done,
  warn,
  error,
  logWithSpinner,
  stopSpinner,
  chalk,
  ensureConfigFile,
  readConfigFile,
  writeConfigFile,
  readPkg,
  FILE_APP_MIGRATIONS_PLUGIN_VERSIONS,
  FILE_APP_MIGRATIONS_RECORDS,
} = require('@nodepack/utils')
const inquirer = require('inquirer')
const { getVersion, hasPlugin } = require('../util/plugins')
const printNoRollbackWarn = require('../util/printNoRollbackWarn')

const logTypes = {
  log,
  info,
  done,
  warn,
  error,
}

module.exports = class Migrator {
  /**
   * @param {string} cwd
   * @param {MigratorOptions} options
   */
  constructor (cwd, {
    plugins = [],
    completeCbs = [],
  } = {}) {
    this.cwd = cwd
    this.plugins = plugins
    this.completeCbs = completeCbs

    this.upPrepared = false
    this.downPrepared = false

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

  /**
   * @param {Preset?} preset
   */
  async up (preset = null) {
    if (!this.upPrepared) {
      await this.prepareUp()
    }

    /** @type {MigrationAllOptions?} */
    let options = null
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
        error(`An error occured while performing app migration: ${chalk.grey(migration.plugin.id)} ${chalk.bold(migration.options.title)}`)
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

  /**
   * @param {string []} removedPlugins
   */
  async prepareRollback (removedPlugins) {
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

  /**
   * @param {string []} removedPlugins
   */
  async down (removedPlugins) {
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
   * @returns {Promise.<Migration []>}
   */
  async resolveMigrations () {
    /** @type {Migration []} */
    const list = []
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
   * @param {string []} removedPlugins
   */
  async resolveRollbacks (removedPlugins) {
    /** @type {Migration []} */
    const list = []
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

  /**
   * @param {Migration []} migrations
   * @returns {Promise.<MigrationAllOptions>}
   */
  async resolvePrompts (migrations) {
    /** @type {MigrationAllOptions} */
    const rootOptions = {}
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
        log(chalk.grey(`${migration.plugin.id} is prompting:`))
        let answers = await inquirer.prompt(prompts)
        // Check if answers are seriazable
        try {
          const oldAnswers = answers
          answers = JSON.parse(JSON.stringify(answers))
          if (Object.keys(answers).length !== Object.keys(oldAnswers).length) {
            throw new Error(`Missing answers`)
          }
        } catch (e) {
          error(`Answers are not serializable into JSON for plugin ${migration.plugin.id} migration ${migration.options.id}`)
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
   * @param {string []} removedPlugins
   */
  async writePluginVersions (removedPlugins = []) {
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
          error(`Invalid api.addNotice type '${type}'.`, shortId)
        } else {
          const tag = message ? shortId : null
          logFn(message, tag)
        }
      })
      log()
    }
  }
}
