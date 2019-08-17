/** @typedef {import('./MigrationOperation')} MigrationOperation */
/** @typedef {import('./Migrator').NoticeType} NoticeType */
/** @typedef {import('./MigrationOperation').FileMiddleware} FileMiddleware */
/** @typedef {import('./MigrationOperation').FilePostProcessor} FilePostProcessor */
/** @typedef {import('@nodepack/config-transformer/src/lib/ConfigTransform').ConfigTransformOptions} ConfigTransformOptions */

/**
 * @typedef SimpleFile
 * @prop {string} path Folder including last slash.
 * @prop {string} name File name without extension.
 * @prop {string} ext File extension without starting dot.
 */

const path = require('path')
const fs = require('fs')
const deepmerge = require('deepmerge')
const { isBinaryFileSync } = require('isbinaryfile')
const ejs = require('ejs')
const { resolveFile, resolveFiles } = require('../util/files')
const { hasPlugin } = require('../util/plugins')
const { warn } = require('@nodepack/utils')
const { ConfigTransform, stringifyJS } = require('@nodepack/config-transformer')
const mergeDeps = require('../util/mergeDeps')
const { resolveModule } = require('@nodepack/module')

const isString = val => typeof val === 'string'
const isFunction = val => typeof val === 'function'
const isObject = val => val && typeof val === 'object'
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))

module.exports = class MigrationOperationAPI {
  /**
   * @param {MigrationOperation} migrationOperation
   */
  constructor (migrationOperation) {
    this.migrationOperation = migrationOperation
  }

  /**
   * Resolves the data when rendering templates.
   *
   * @private
   */
  _resolveData (additionalData) {
    return Object.assign({
      options: this.migrationOperation.options,
      rootOptions: this.migrationOperation.rootOptions,
    }, additionalData)
  }

  /**
   * Inject a file processing middleware.
   *
   * @private
   * @param {FileMiddleware} middleware - A middleware function that receives the
   *   virtual files tree object, and an ejs render function. Can be async.
   */
  _injectFileMiddleware (middleware) {
    this.migrationOperation.fileMiddlewares.push(middleware)
  }

  /**
   * Plugin id.
   */
  get pluginId () {
    return this.migrationOperation.migration.plugin.id
  }

  /**
   * Current working directory.
   */
  get cwd () {
    return this.migrationOperation.cwd
  }

  /**
   * Resolve path in the project.
   *
   * @param {string} filePath - Relative path from project root
   * @return {string} The resolved absolute path.
   */
  resolve (filePath) {
    return resolveFile(this.cwd, filePath)
  }

  /**
   * Check if the project has a plugin installed
   * @param {string} id Plugin id
   */
  hasPlugin (id) {
    return hasPlugin(
      id,
      this.migrationOperation.migrator.plugins, this.migrationOperation.pkg
    )
  }

  /**
   * Configure how config files are extracted.
   *
   * @param {string} key - Config key in package.json (for example `'nodepack'` or `'babel'`)
   * @param {ConfigTransformOptions} options - Options
   */
  addConfigTransform (key, options) {
    const hasReserved = Object.keys(this.migrationOperation.reservedConfigTransforms).includes(key)
    if (
      hasReserved ||
      !options ||
      !options.file
    ) {
      if (hasReserved) {
        warn(`Reserved config transform '${key}'`)
      }
      return
    }

    this.migrationOperation.configTransforms[key] = new ConfigTransform(options)
  }

  /**
   * Extend the package.json of the project.
   * Nested fields are deep-merged unless `merge: false` is passed.
   * Also resolves dependency conflicts between plugins.
   * Tool configuration fields may be extracted into standalone files before
   * files are written to disk.
   *
   * @param {object | ((pkg: any) => object)} fields - Fields to merge.
   * @param {boolean} merge - Deep-merge nested fields.
   */
  extendPackage (fields, merge = true) {
    const pkg = this.migrationOperation.pkg
    const toMerge = isFunction(fields) ? fields(pkg) : fields
    for (const key in toMerge) {
      const value = toMerge[key]
      const existing = pkg[key]
      if (isObject(value) && (key === 'dependencies' || key === 'devDependencies')) {
        // use special version resolution merge
        pkg[key] = mergeDeps(
          this.pluginId,
          existing || {},
          value,
          this.migrationOperation.depSources
        )
      } else if (!(key in pkg)) {
        pkg[key] = value
      } else if (Array.isArray(value) && Array.isArray(existing)) {
        pkg[key] = mergeArrayWithDedupe(existing, value)
      } else if (isObject(value) && isObject(existing) && merge) {
        pkg[key] = deepmerge(existing, value, { arrayMerge: mergeArrayWithDedupe })
      } else {
        pkg[key] = value
      }
    }
  }

  /**
   * Render template files into the virtual files tree object.
   *
   * @param {string | object | FileMiddleware} source -
   *   Can be one of:
   *   - relative path to a directory;
   *   - Object hash of { sourceTemplate: targetFile } mappings;
   *   - a custom file middleware function.
   * @param {object} [additionalData] - additional data available to templates.
   * @param {object} [ejsOptions] - options for ejs.
   */
  render (source, additionalData = {}, ejsOptions = {}) {
    const baseDir = extractCallDir()
    if (isString(source)) {
      source = path.resolve(baseDir, source)
      this._injectFileMiddleware(async (files) => {
        const data = this._resolveData(additionalData)
        const globby = require('globby')
        const _files = await globby(['**/*'], { cwd: source })
        for (const rawPath of _files) {
          const targetPath = rawPath.split('/').map(filename => {
            // dotfiles are ignored when published to npm, therefore in templates
            // we need to use underscore instead (e.g. "_gitignore")
            if (filename.charAt(0) === '_' && filename.charAt(1) !== '_') {
              return `.${filename.slice(1)}`
            }
            if (filename.charAt(0) === '_' && filename.charAt(1) === '_') {
              return `${filename.slice(1)}`
            }
            return filename
          }).join('/')
          const sourcePath = path.resolve(source, rawPath)
          const content = renderFile(sourcePath, data, ejsOptions)
          // only set file if it's not all whitespace, or is a Buffer (binary files)
          if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
            this.migrationOperation.writeFile(targetPath, content, files)
          }
        }
      })
    } else if (isObject(source)) {
      this._injectFileMiddleware(files => {
        const data = this._resolveData(additionalData)
        for (const targetPath in source) {
          const sourcePath = path.resolve(baseDir, source[targetPath])
          const content = renderFile(sourcePath, data, ejsOptions)
          if (Buffer.isBuffer(content) || content.trim()) {
            this.migrationOperation.writeFile(targetPath, content, files)
          }
        }
      })
    } else if (isFunction(source)) {
      this._injectFileMiddleware(source)
    }
  }

  /**
   * Delete files from the virtual files tree object. Opposite of `render`.
   *
   * @param {string | object | FileMiddleware} source -
   *   Can be one of:
   *   - relative path to a directory;
   *   - Object hash of { sourceTemplate: targetFile } mappings;
   *   - a custom file middleware function.
   */
  unrender (source) {
    const baseDir = extractCallDir()
    if (isString(source)) {
      source = path.resolve(baseDir, source)
      this._injectFileMiddleware(async (files) => {
        const globby = require('globby')
        const _files = await globby(['**/*'], { cwd: source })
        for (const rawPath of _files) {
          const targetPath = rawPath.split('/').map(filename => {
            // dotfiles are ignored when published to npm, therefore in templates
            // we need to use underscore instead (e.g. "_gitignore")
            if (filename.charAt(0) === '_' && filename.charAt(1) !== '_') {
              return `.${filename.slice(1)}`
            }
            if (filename.charAt(0) === '_' && filename.charAt(1) === '_') {
              return `${filename.slice(1)}`
            }
            return filename
          }).join('/')
          delete files[targetPath]
        }
      })
    } else if (isObject(source)) {
      this._injectFileMiddleware(files => {
        for (const targetPath in source) {
          delete files[targetPath]
        }
      })
    } else if (isFunction(source)) {
      this._injectFileMiddleware(source)
    }
  }

  /**
   * Move files.
   *
   * @param {string} from `globby` pattern.
   * @param {(file: SimpleFile) => string} to Name transform.
   */
  move (from, to) {
    this._injectFileMiddleware(async (files) => {
      const resolvedFiles = await resolveFiles(this.cwd, from)
      for (const file in resolvedFiles) {
        const ext = path.extname(file)
        const newFile = to({
          path: path.dirname(file) + '/',
          name: path.basename(file, ext),
          ext: ext.substr(1),
        })
        if (newFile !== file) {
          const f = files[newFile] = files[file]
          f.move(newFile)
          delete files[file]
        }
      }
    })
  }

  /**
   * Modify a file.
   *
   * @param {string} filePath Path of the file in the project.
   * @param {(content: string | Buffer) => string | Buffer | Promise.<string | Buffer>} cb File transform.
   */
  modifyFile (filePath, cb) {
    this._injectFileMiddleware(async (files) => {
      const file = files[filePath]
      if (file) {
        file.source = await cb(file.source)
      }
    })
  }

  /**
   * Push a file middleware that will be applied after all normal file
   * middelwares have been applied.
   *
   * @param {FilePostProcessor} cb
   */
  postProcessFiles (cb) {
    this.migrationOperation.postProcessFilesCbs.push(cb)
  }

  /**
   * convenience method for generating a js config file from json
   */
  genJSConfig (value) {
    return `module.exports = ${stringifyJS(value)}`
  }

  /**
   * Displays a message for the user at the end of all migration operations.
   * @param {string} message
   * @param {NoticeType} type
   */
  addNotice (message, type = 'info') {
    this.migrationOperation.migrator.notices.push({
      pluginId: this.migrationOperation.migration.plugin.id,
      type,
      message,
    })
  }

  /**
   * Called once after migration operation is completed.
   * @param {function} cb
   */
  onComplete (cb) {
    this.migrationOperation.completeCbs.push(cb)
  }
}

function extractCallDir () {
  // extract api.render() callsite file location using error stack
  const obj = {}
  Error.captureStackTrace(obj)
  const callSite = obj.stack.split('\n')[3]
  const fileName = callSite.match(/\s\((.*):\d+:\d+\)$/)[1]
  return path.dirname(fileName)
}

const replaceBlockRE = /<%# REPLACE %>([^]*?)<%# END_REPLACE %>/g

function renderFile (name, data, ejsOptions) {
  if (isBinaryFileSync(name)) {
    return fs.readFileSync(name) // return buffer
  }
  const template = fs.readFileSync(name, 'utf-8')

  // custom template inheritance via yaml front matter.
  // ---
  // extend: 'source-file'
  // replace: !!js/regexp /some-regex/
  // OR
  // replace:
  //   - !!js/regexp /foo/
  //   - !!js/regexp /bar/
  // ---
  const yaml = require('yaml-front-matter')
  const parsed = yaml.loadFront(template)
  const content = parsed.__content
  let finalTemplate = content.trim() + `\n`
  if (parsed.extend) {
    const extendPath = path.isAbsolute(parsed.extend)
      ? parsed.extend
      : resolveModule(parsed.extend, path.dirname(name))
    finalTemplate = fs.readFileSync(extendPath, 'utf-8')
    if (parsed.replace) {
      if (Array.isArray(parsed.replace)) {
        const replaceMatch = content.match(replaceBlockRE)
        if (replaceMatch) {
          const replaces = replaceMatch.map(m => {
            return m.replace(replaceBlockRE, '$1').trim()
          })
          parsed.replace.forEach((r, i) => {
            finalTemplate = finalTemplate.replace(r, replaces[i])
          })
        }
      } else {
        finalTemplate = finalTemplate.replace(parsed.replace, content.trim())
      }
    }
    if (parsed.when) {
      finalTemplate = (
        `<%_ if (${parsed.when}) { _%>` +
          finalTemplate +
        `<%_ } _%>`
      )
    }
  }

  return ejs.render(finalTemplate, data, ejsOptions)
}
