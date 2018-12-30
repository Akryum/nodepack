/** @typedef {import('@nodepack/service').ProjectOptions} ProjectOptions */
/** @typedef {import('./MigratorPlugin')} MigratorPlugin */
/** @typedef {import('../../types/MigrationOptions').MigrationOptions} MigrationOptions */
/** @typedef {import('@nodepack/utils').Preset} Preset */

/** @typedef {Object.<string, Object.<string, any>>} MigrationsOptions */

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
const { readPkg } = require('../util/pkg')
const {
  toShortPluginId,
  isPlugin,
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
  FILE_APP_MIGRATIONS_PLUGIN_VERSIONS,
  FILE_APP_MIGRATIONS_RECORDS,
} = require('@nodepack/utils')
const inquirer = require('inquirer')
const { getVersion } = require('../util/plugins')

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

    /** @type {Migration []} */
    this.migrations = []
    /** @type {MigrationRecord []} */
    this.migrationRecords = []
    /** @type {Map<string, boolean>} */
    this.migratedIds = new Map()
    /** @type {Notice []} */
    this.notices = []
  }

  /**
   * @param {Preset?} preset
   */
  async migrate (preset = null) {
    /** @type {MigrationsOptions?} */
    let options = null
    let extractConfigFiles = false

    if (preset) {
      extractConfigFiles = preset.useConfigFiles || false
      if (preset.appMigrations && preset.appMigrations.options) {
        options = preset.appMigrations.options
      }
    }

    await this.setup()
    await this.readPluginVersions()

    const migrations = await this.resolveMigrations()

    // Prompts
    const rootOptions = options || await this.resolvePrompts(migrations)

    for (const migration of migrations) {
      // Prompts results
      const pluginOptions = rootOptions[migration.plugin.id]
      const migrationOptions = (pluginOptions && pluginOptions[migration.options.id]) || {}

      const operation = new MigrationOperation(this, migration, {
        options: migrationOptions,
        rootOptions,
      })

      logWithSpinner('✔️', `${chalk.grey(migration.plugin.id)} ${migration.options.title}`)

      await operation.migrate({
        extractConfigFiles,
      })

      stopSpinner()

      // Mark migration as completed
      this.migrationRecords.push({
        id: migration.options.id,
        pluginId: migration.plugin.id,
        pluginVersion: migration.plugin.currentVersion || '',
        options: operation.options,
      })
    }

    // Write config files
    await this.writeMigrationRecords()
    await this.writePluginVersions()

    await this.applyCompleteCbs()

    await this.displayNotices()
  }

  async rollback () {
    // TODO
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
      if (this.migratedIds.get(`${migration.plugin.id}${migration.options.id}`)) {
        continue
      }

      if (migration.options.when) {
        const whenApi = new MigrationWhenAPI(migration.plugin, this, {
          pkg: this.pkg,
        })
        const result = await migration.options.when(whenApi)
        if (!result) {
          continue
        }
      }

      list.push(migration)
    }
    return list
  }

  /**
   * @private
   * @param {string} pluginId
   * @param {string?} migrationId
   */
  async resolveRollbacks (pluginId, migrationId = null) {
    // TODO
  }

  /**
   * @param {Migration []} migrations
   * @returns {Promise.<MigrationsOptions>}
   */
  async resolvePrompts (migrations) {
    /** @type {MigrationsOptions} */
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
        const answers = await inquirer.prompt(prompts)
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
  async writePluginVersions () {
    const result = {}
    for (const plugin of this.plugins) {
      result[plugin.id] = plugin.currentVersion
    }

    // Plugins without migrations
    // should also have their version saved
    const deps = {
      ...this.pkg.dependencies,
      ...this.pkg.devDependencies,
    }
    for (const id in deps) {
      if (!result[id] && isPlugin(id)) {
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
