const path = require('path')
const fs = require('fs-extra')

/**
 * Applied migrations are recorded in this file.
 */
exports.FILE_APP_MIGRATIONS_RECORDS = 'app-migration-records.json'

/**
 * Plugin which had migrations applied are saved in this file.
 */
exports.FILE_APP_MIGRATIONS_PLUGIN_VERSIONS = 'app-migration-plugin-versions.json'

/**
 * Content generated in the config folder's git ignore file.
 */
exports.FILE_CONTENT_GITIGNORE = `/temp
`

/**
 * Content generated in the config folder's README.
 */
exports.FILE_CONTENT_README = `# Nodepack internal config files

Add this to version control. Modify at yourn own risk!
`

/**
 * @param {string} cwd
 */
exports.getConfigFolder = cwd => path.join(cwd, '.nodepack')

/**
 * Ensure the config folder exists.
 * Generate minimal required files like `.gitignore`.
 *
 * @param {string} cwd
 */
exports.ensureConfigFolder = async cwd => {
  await fs.ensureDir(exports.getConfigFolder(cwd))
  // Always write gitignore content
  await exports.writeConfigFile(cwd, '.gitignore', exports.FILE_CONTENT_GITIGNORE)
  // Readme
  await exports.writeConfigFile(cwd, 'README.md', exports.FILE_CONTENT_README)
}

/**
 * Ensure a config file exists.
 * If it doesn't, create it with a default content.
 *
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 * @param {any} defaultContent
 */
exports.ensureConfigFile = async (cwd, name, defaultContent) => {
  await exports.ensureConfigFolder(cwd)
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  if (!await fs.pathExists(file)) {
    await exports.writeConfigFile(cwd, name, defaultContent)
  }
}

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 */
exports.readConfigFile = async (cwd, name) => {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  return fs.readJSON(file)
}

/**
 * @param {string} cwd Working directory.
 * @param {string} name File name.
 * @param {string | any} content String, or Object that will be serialized in JSON.
 */
exports.writeConfigFile = async (cwd, name, content) => {
  const base = exports.getConfigFolder(cwd)
  const file = path.join(base, name)
  if (typeof content === 'string') {
    await fs.writeFile(file, content, {
      encoding: 'utf8',
    })
  } else {
    await fs.writeJSON(file, content, {
      spaces: 2,
    })
  }
}
