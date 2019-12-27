// API
import { MigrationOperationAPI } from './MigrationOperationAPI'
// Utils
import ejs from 'ejs'
import { ConfigTransform } from '@nodepack/config-transformer'
import { ensureEOL, sortPkg, readPkg } from '@nodepack/utils'
import { MigrationOperationFile as GeneratorFile } from './MigrationOperationFile'
import { Migrator, Migration } from './Migrator'
import { writeFileTree } from '../util/writeFileTree'
import { readFiles, normalizeFilePaths } from '../util/files'

export type FileTree = { [key: string]: GeneratorFile }

export type FileMiddleware = (files: FileTree, render: Function) => Promise<void> | void

export type FilePostProcessor = (files: FileTree) => Promise<void> | void

export type MigrationType = 'up' | 'down'

export interface RunOptions {
  extractConfigFiles: boolean
}

export interface MigrationOperationOptions {
  completeCbs?: Function[]
  /** Options from migration prompts */
  options?: any
  /** Options from all migration prompts */
  rootOptions?: any
}

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

type ConfigTransforms = { [key: string]: ConfigTransform }

export class MigrationOperation {
  migrator: Migrator
  migration: Migration
  completeCbs: Function[]
  options: any
  rootOptions: any
  configTransforms: ConfigTransforms = {}
  originalPkg: any
  pkg: any
  // Config file transforms
  defaultConfigTransforms: ConfigTransforms = defaultConfigTransforms
  reservedConfigTransforms: ConfigTransforms = reservedConfigTransforms
  // for conflict resolution
  depSources: { [key: string]: string } = {}
  // virtual file tree
  files: FileTree = {}
  fileMiddlewares: FileMiddleware[] = []
  postProcessFilesCbs: FilePostProcessor[] = []

  constructor (migrator: Migrator, migration: Migration, {
    completeCbs = [],
    options = {},
    rootOptions = {},
  }: MigrationOperationOptions = {}) {
    this.migrator = migrator
    this.migration = migration
    this.completeCbs = completeCbs
    this.options = options
    this.rootOptions = rootOptions
  }

  get cwd () {
    return this.migrator.cwd
  }

  async run (type: MigrationType, {
    extractConfigFiles,
  }: RunOptions) {
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
   */
  writeFile (filename: string, source: string | Buffer, files = this.files) {
    if (typeof source === 'string') {
      source = ensureEOL(source)
    }
    const file = files[filename]
    if (file) {
      file.source = source
    } else {
      files[filename] = new GeneratorFile(this.cwd, filename, source, true)
    }
  }

  /**
   * Extract config files into separate files.
   *
   * @private
   */
  extractConfigFiles (extractAll: boolean, checkExisting: boolean) {
    const configTransforms: ConfigTransforms = Object.assign({},
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
