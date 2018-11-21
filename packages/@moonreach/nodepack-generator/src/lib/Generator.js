/** @typedef {import('@moonreach/nodepack').ProjectOptions} ProjectOptions */
/** @typedef {import('./GeneratorPlugin')} GeneratorPlugin */
/**
 * @typedef GeneratorOptions
 * @prop {any} [pkg]
 * @prop {GeneratorPlugin []} [plugins]
 * @prop {ProjectOptions} [projectOptions]
 * @prop {function []} [completeCbs]
 * @prop {boolean} [invoking]
 */
/** @typedef {Object.<string, GeneratorFile>} FileTree */
/**
 * @typedef ExitLog
 * @prop {string} id
 * @prop {string} msg
 * @prop {'log' | 'info' | 'done' | 'warn' | 'error'} type
 */
/** @typedef {(files: FileTree, render: function) => Promise | void} FileMiddleware */
/** @typedef {(files: FileTree) => Promise | void} FilePostProcessor */

const ejs = require('ejs')
const GeneratorPluginAPI = require('./GeneratorPluginAPI')
const cloneDeep = require('lodash.clonedeep')
const { ConfigTransform } = require('@moonreach/config-transformer')
const {
  ensureEOL,
  sortObject,
  matchesPluginId,
  toShortPluginId,
} = require('@moonreach/nodepack-utils')
const GeneratorFile = require('./GeneratorFile')
const writeFileTree = require('../util/writeFileTree')
const normalizeFilePaths = require('../util/normalizeFilePaths')

const defaultConfigTransforms = {
  babel: new ConfigTransform({
    file: {
      js: ['babel.config.js'],
    },
  }),
  eslintConfig: new ConfigTransform({
    file: {
      js: ['.eslintrc.js'],
      json: ['.eslintrc', '.eslintrc.json'],
      yaml: ['.eslintrc.yaml', '.eslintrc.yml'],
    },
  }),
  jest: new ConfigTransform({
    file: {
      js: ['jest.config.js'],
    },
  }),
}

const reservedConfigTransforms = {
  nodepack: new ConfigTransform({
    file: {
      js: ['nodepack.config.js'],
    },
  }),
}

const logger = require('@moonreach/nodepack-utils/src/logger')
const logTypes = {
  log: logger.log,
  info: logger.info,
  done: logger.done,
  warn: logger.warn,
  error: logger.error,
}

module.exports = class Generator {
  /**
   * @param {string} cwd
   * @param {GeneratorOptions} options
   */
  constructor (cwd, {
    pkg = {},
    plugins = [],
    projectOptions = {},
    completeCbs = [],
    invoking = false,
  }) {
    this.cwd = cwd
    this.originalPkg = pkg
    this.pkg = cloneDeep(pkg)
    this.plugins = plugins
    this.projectOptions = projectOptions
    this.rootOptions = {}
    this.completeCbs = completeCbs
    this.invoking = invoking
    // Config file transforms
    this.configTransforms = {}
    this.defaultConfigTransforms = defaultConfigTransforms
    this.reservedConfigTransforms = reservedConfigTransforms
    // for conflict resolution
    this.depSources = {}
    // virtual file tree
    /** @type {FileTree} */
    this.files = {}
    /** @type {FileMiddleware []} */
    this.fileMiddlewares = []
    /** @type {FilePostProcessor []} */
    this.postProcessFilesCbs = []
    /**
     * exit messages displayed at the end
     * @type {ExitLog []}
     */
    this.exitLogs = []
  }

  async generate ({
    extractConfigFiles = false,
    checkExisting = false,
  } = {}) {
    if (this.invoking) {
      // Read existing files
      await this.readFiles()
    }

    const previousFileNames = Object.keys(this.files)

    await this.applyPlugins()

    // extract configs from package.json into dedicated files.
    this.extractConfigFiles(extractConfigFiles, checkExisting)

    // wait for file resolve
    await this.resolveFiles()

    // set package.json
    this.sortPkg()
    this.writeFile('package.json', JSON.stringify(this.pkg, null, 2))

    // write/update file tree to disk
    await writeFileTree(this.cwd, this.files, previousFileNames)
  }

  /**
   * Read the project file tree
   * @private
   */
  async readFiles () {
    const readFiles = require('../util/readFiles')
    this.files = await readFiles(this.cwd)
  }

  /**
   * @param {boolean} extractAll
   * @param {boolean} checkExisting
   */
  extractConfigFiles (extractAll, checkExisting) {
    /** @type {Object.<string, ConfigTransform>} */
    const configTransforms = Object.assign({},
      defaultConfigTransforms,
      this.configTransforms,
      reservedConfigTransforms
    )
    const extract = key => {
      if (
        configTransforms[key] &&
        this.pkg[key] &&
        // do not extract if the field exists in original package.json
        !this.originalPkg[key]
      ) {
        const value = this.pkg[key]
        const configTransform = configTransforms[key]
        const { content, filename } = configTransform.transform(
          value,
          checkExisting,
          this.files,
          this.cwd,
        )
        this.writeFile(filename, content)
        delete this.pkg[key]
      }
    }
    if (extractAll) {
      for (const key in this.pkg) {
        extract(key)
      }
    } else {
      if (!process.env.NODEPACK_TEST) {
        // by default, always extract nodepack.config.js
        extract('nodepack')
      }
      // always extract babel.config.js as this is the only way to apply
      // project-wide configuration even to dependencies.
      // TODO: this can be removed when Babel supports root: true in package.json
      extract('babel')
    }
  }

  /**
   * Write a file content into virtual filesystem
   * @param {string} filename
   * @param {string | Buffer} source
   */
  writeFile (filename, source, files = this.files) {
    if (typeof source === 'string') {
      source = ensureEOL(source)
    }
    const file = this.files[filename]
    if (file) {
      file.source = source
    } else {
      this.files[filename] = new GeneratorFile(filename, source, true)
    }
  }

  /**
   * @private
   */
  async applyPlugins () {
    // apply plugins
    for (const { id, apply } of this.plugins) {
      await apply(new GeneratorPluginAPI(id, this), this.projectOptions || {})
    }
  }

  sortPkg () {
    // ensure package.json keys has readable order
    this.pkg.dependencies = sortObject(this.pkg.dependencies)
    this.pkg.devDependencies = sortObject(this.pkg.devDependencies)
    this.pkg.scripts = sortObject(this.pkg.scripts, [
      'serve',
      'build',
      'test',
      'e2e',
      'lint',
      'deploy',
    ])
    this.pkg = sortObject(this.pkg, [
      'name',
      'version',
      'private',
      'description',
      'author',
      'scripts',
      'dependencies',
      'devDependencies',
      'nodepack',
      'babel',
      'eslintConfig',
      'prettier',
      'jest',
    ])
  }

  async resolveFiles () {
    const files = this.files
    for (const middleware of this.fileMiddlewares) {
      await middleware(files, ejs.render)
    }

    // normalize file paths on windows
    // all paths are converted to use / instead of \
    normalizeFilePaths(files)

    for (const postProcess of this.postProcessFilesCbs) {
      await postProcess(files)
    }
  }

  /**
   * Check if the project has a plugin installed
   * @param {string} id Plugin id
   */
  hasPlugin (id) {
    if (id === 'router') id = 'vue-router'
    if (['vue-router', 'vuex'].includes(id)) {
      const pkg = this.pkg
      return ((pkg.dependencies && pkg.dependencies[id]) || (pkg.devDependencies && pkg.devDependencies[id]))
    }
    return [
      ...this.plugins.map(p => p.id),
      ...Object.keys(this.pkg.devDependencies || {}),
      ...Object.keys(this.pkg.dependencies || {}),
    ].some(name => matchesPluginId(name, id))
  }

  /**
   * Output the final logs pushed by the plugins
   */
  printExitLogs () {
    if (this.exitLogs.length) {
      this.exitLogs.forEach(({ id, msg, type }) => {
        const shortId = toShortPluginId(id)
        const logFn = logTypes[type]
        if (!logFn) {
          logger.error(`Invalid api.exitLog type '${type}'.`, shortId)
        } else {
          const tag = msg ? shortId : null
          logFn(msg, tag)
        }
      })
      logger.log()
    }
  }
}
