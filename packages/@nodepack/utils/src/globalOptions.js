/**
 * @typedef Preset
 * @prop {string?} [name]
 * @prop {boolean?} [useConfigFiles]
 * @prop {Object.<string,string>?} [plugins]
 * @prop {PresetAppMigrations?} [appMigrations]
 */
/**
 * @typedef {Object.<string, any>} PresetAppMigrations
 */
/**
 * @typedef GlobalOptions
 * @prop {string?} [packageManager]
 * @prop {boolean?} [useTaobaoRegistry]
 * @prop {Object.<string, SuggestionSettings>?} [suggestions]
 * @prop {Object.<string, Preset>?} [presets]
 */
/**
 * @typedef SuggestionSettings
 * @prop {boolean} alwaysApply
 */

const fs = require('fs-extra')
const cloneDeep = require('lodash.clonedeep')
const { getRcPath } = require('./rcPath')
const consola = require('consola')
const { createSchema, validate } = require('./validate')

const rcPath = exports.rcPath = getRcPath('.nodepackrc')

const defaultSchema = createSchema(joi => joi.object().keys({
  packageManager: joi.string().only(['yarn', 'npm']),
  useTaobaoRegistry: joi.boolean(),
  suggestions: joi.object(),
  presets: joi.object(),
}))

/** @type {Preset} */
exports.defaultPreset = {
  name: 'Default preset',
  useConfigFiles: false,
  plugins: {
    '@nodepack/plugin-babel': '',
  },
}

/** @type {GlobalOptions} */
exports.defaultGlobalOptions = {
  packageManager: null,
  useTaobaoRegistry: null,
  suggestions: null,
  presets: {
    default: exports.defaultPreset,
  },
}

const cachedOptions = {}

/**
 * @returns {GlobalOptions}
 */
exports.loadGlobalOptions = function (file = rcPath, schema = defaultSchema) {
  if (cachedOptions[file]) {
    return cachedOptions[file]
  }
  if (fs.existsSync(file)) {
    try {
      cachedOptions[file] = fs.readJsonSync(file)
    } catch (e) {
      consola.error(
        `Error loading saved preferences: ` +
        `${file} may be corrupted or have syntax errors. ` +
        `Please fix/delete it and re-run nodepack in manual mode.\n` +
        `(${e.message})`,
      )
      process.exit(1)
    }
    if (schema) {
      validate(cachedOptions[file], schema, message => {
        consola.error(
          `${file} may be outdated. ` +
          `Please delete it and re-run nodepack in manual mode.\n` +
          `(${message})`,
        )
      })
    }
    return cachedOptions[file]
  } else {
    return {}
  }
}

/**
 * @param {GlobalOptions} toSave
 */
exports.saveGlobalOptions = function (toSave, file = rcPath) {
  const options = Object.assign(
    // Current options
    cloneDeep(exports.loadGlobalOptions()),
    toSave,
  )
  // Remove invalid keys
  for (const key in options) {
    if (!(key in exports.defaultGlobalOptions)) {
      delete options[key]
    }
  }
  cachedOptions[file] = options
  try {
    fs.writeJsonSync(file, options, {
      spaces: 2,
    })
  } catch (e) {
    consola.error(
      `Error saving preferences: ` +
      `make sure you have write access to ${file}.\n` +
      `(${e.message})`,
    )
  }
}
