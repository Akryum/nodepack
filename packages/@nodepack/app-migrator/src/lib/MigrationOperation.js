/** @typedef {import('@nodepack/service').ProjectOptions} ProjectOptions */
/** @typedef {import('./Migrator')} Migrator */
/** @typedef {import('./Migrator').Migration} Migration */

/**
 * @typedef MigratorOperationOptions
 * @prop {function []} [completeCbs]
 * @prop {any} [options] Options from migration prompts
 * @prop {any} [rootOptions] Options from all migration prompts
 */

/** @typedef {Object.<string, GeneratorFile>} FileTree */
/** @typedef {(files: FileTree, render: function) => Promise | void} FileMiddleware */
/** @typedef {(files: FileTree) => Promise | void} FilePostProcessor */

// API
const MigrationOperationAPI = require('./MigrationOperationAPI')
// Utils
const ejs = require('ejs')
const { ConfigTransform } = require('@nodepack/config-transformer')
const { ensureEOL, sortPkg, readPkg } = require('@nodepack/utils')
const GeneratorFile = require('./MigrationOperationFile')
const writeFileTree = require('../util/writeFileTree')
const { readFiles, normalizeFilePaths } = require('../util/files')

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

module.exports = class MigrationOperation {
  /**
   * @param {Migrator} migrator
   * @param {Migration} migration
   * @param {MigratorOperationOptions} options
   */
  constructor (migrator, migration, {
    completeCbs = [],
    options = {},
    rootOptions = {},
  } = {}) {
    this.migrator = migrator
    this.migration = migration
    this.completeCbs = completeCbs
    this.options = options
    this.rootOptions = rootOptions

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
  }

  get cwd () {
    return this.migrator.cwd
  }

  /**
   * @param {'up' | 'down'} type
   * @param {object} param
   * @param {boolean} param.extractConfigFiles
   */
  async run (type, {
    extractConfigFiles,
  }) {
    const method = this.migration.options[type]

    if (method) {
      // Read existing files
      await this.readFiles()

      const previousFileNames = Object.keys(this.files)

      await method(new MigrationOperationAPI(this), this.options, this.rootOptions)

      // extract configs from package.json into dedicated files.
      this.extractConfigFiles(extractConfigFiles, true)

      // wait for file resolve
      await this.resolveFiles()

      // set package.json
      this.pkg = sortPkg(this.pkg)
      this.writeFile('package.json', JSON.stringify(this.pkg, null, 2))

      // write/update file tree to disk
      await writeFileTree(this.cwd, this.files, previousFileNames)
    }
  }

  /**
   * Read the project file tree.
   *
   * @private
   */
  async readFiles () {
    this.originalPkg = await readPkg(this.cwd)
    this.pkg = await readPkg(this.cwd)
    this.files = await readFiles(this.cwd)
  }

  /**
   * Write a file content into virtual filesystem.
   *
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
      this.files[filename] = new GeneratorFile(this.cwd, filename, source, true)
    }
  }

  /**
   * Extract config files into separate files.
   *
   * @private
   * @param {boolean} extractAll
   * @param {boolean} checkExisting
   */
  extractConfigFiles (extractAll, checkExisting) {
    /** @type {Object.<string, ConfigTransform>} */
    const configTransforms = Object.assign({},
      defaultConfigTransforms,
      this.configTransforms,
      reservedConfigTransforms,
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
   * Apply middlewares, normalization and file post processing.
   *
   * @private
   */
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
}
