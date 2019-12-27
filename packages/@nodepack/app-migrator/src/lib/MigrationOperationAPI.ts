import path from 'path'
import fs from 'fs'
import deepmerge from 'deepmerge'
import { isBinaryFileSync } from 'isbinaryfile'
import ejs from 'ejs'
import { resolveFile, resolveFiles } from '../util/files'
import { hasPlugin } from '../util/plugins'
import consola from 'consola'
import { ConfigTransform, stringifyJS, ConfigTransformOptions } from '@nodepack/config-transformer'
import { mergeDeps } from '../util/mergeDeps'
import { resolveModule } from '@nodepack/module'
import { MigrationOperation, FileMiddleware, FilePostProcessor } from './MigrationOperation'
import { NoticeType } from './Migrator'

export interface SimpleFile {
  /** Folder including last slash. */
  path: string
  /** File name without extension. */
  name: string
  /** File extension without starting dot. */
  ext: string
}

const isObject = val => val && typeof val === 'object'
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))

export class MigrationOperationAPI {
  migrationOperation: MigrationOperation

  constructor (migrationOperation: MigrationOperation) {
    this.migrationOperation = migrationOperation
  }

  /**
   * Resolves the data when rendering templates.
   *
   * @private
   */
  _resolveData (additionalData: any) {
    return Object.assign({
      options: this.migrationOperation.options,
      rootOptions: this.migrationOperation.rootOptions,
    }, additionalData)
  }

  /**
   * Inject a file processing middleware.
   *
   * @private
   * @param middleware - A middleware function that receives the
   *   virtual files tree object, and an ejs render function. Can be async.
   */
  _injectFileMiddleware (middleware: FileMiddleware) {
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
   * @param filePath - Relative path from project root
   * @return The resolved absolute path.
   */
  resolve (filePath: string) {
    return resolveFile(this.cwd, filePath)
  }

  /**
   * Check if the project has a plugin installed
   * @param id Plugin id
   */
  hasPlugin (id: string) {
    return hasPlugin(
      id,
      this.migrationOperation.migrator.plugins, this.migrationOperation.pkg,
    )
  }

  /**
   * Configure how config files are extracted.
   *
   * @param key - Config key in package.json (for example `'nodepack'` or `'babel'`)
   * @param options - Options
   */
  addConfigTransform (key: string, options: ConfigTransformOptions) {
    const hasReserved = Object.keys(this.migrationOperation.reservedConfigTransforms).includes(key)
    if (
      hasReserved ||
      !options ||
      !options.file
    ) {
      if (hasReserved) {
        consola.warn(`Reserved config transform '${key}'`)
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
   * @param fields - Fields to merge.
   * @param merge - Deep-merge nested fields.
   */
  extendPackage<TFields = any> (fields: TFields | ((pkg: any) => TFields), merge = true) {
    const pkg = this.migrationOperation.pkg
    const toMerge = typeof fields === 'function' ? (fields as (pkg: any) => TFields)(pkg) : fields
    for (const key in toMerge) {
      const value: any = toMerge[key]
      const existing = pkg[key]
      if (isObject(value) && (key === 'dependencies' || key === 'devDependencies')) {
        // use special version resolution merge
        pkg[key] = mergeDeps(
          this.pluginId,
          existing || {},
          value,
          this.migrationOperation.depSources,
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
   * @param source -
   *   Can be one of:
   *   - relative path to a directory;
   *   - Object hash of { sourceTemplate: targetFile } mappings;
   *   - a custom file middleware function.
   * @param additionalData - additional data available to templates.
   * @param ejsOptions - options for ejs.
   */
  render<TSource = any> (source: string | TSource | FileMiddleware, additionalData: any = {}, ejsOptions: any = {}) {
    const baseDir = extractCallDir()
    if (typeof source === 'string') {
      let sourceBasePath = source as string
      sourceBasePath = path.resolve(baseDir, sourceBasePath)
      this._injectFileMiddleware(async (files) => {
        const data = this._resolveData(additionalData)
        const globby = require('globby')
        const _files = await globby(['**/*'], { cwd: sourceBasePath })
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
          const sourcePath = path.resolve(sourceBasePath, rawPath)
          let content
          if (path.extname(sourcePath) !== '.ejs') {
            content = renderFile(sourcePath, data, ejsOptions)
          } else {
            content = fs.readFileSync(sourcePath, { encoding: 'utf8' })
          }
          // only set file if it's not all whitespace, or is a Buffer (binary files)
          if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
            this.migrationOperation.writeFile(targetPath, content, files)
          }
        }
      })
    } else if (isObject(source)) {
      const obj: any = source
      this._injectFileMiddleware(files => {
        const data = this._resolveData(additionalData)
        for (const targetPath in obj) {
          const sourcePath = path.resolve(baseDir, obj[targetPath])
          const content = renderFile(sourcePath, data, ejsOptions)
          if (Buffer.isBuffer(content) || content.trim()) {
            this.migrationOperation.writeFile(targetPath, content, files)
          }
        }
      })
    } else if (typeof source === 'function') {
      const fm = source as FileMiddleware
      this._injectFileMiddleware(fm)
    }
  }

  /**
   * Delete files from the virtual files tree object. Opposite of `render`.
   *
   * @param source -
   *   Can be one of:
   *   - relative path to a directory;
   *   - Object hash of { sourceTemplate: targetFile } mappings;
   *   - a custom file middleware function.
   */
  unrender<TSource = any> (source: string | TSource | FileMiddleware) {
    const baseDir = extractCallDir()
    if (typeof source === 'string') {
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
      const obj: any = source
      this._injectFileMiddleware(files => {
        for (const targetPath in obj) {
          delete files[targetPath]
        }
      })
    } else if (typeof source === 'function') {
      const fm = source as FileMiddleware
      this._injectFileMiddleware(fm)
    }
  }

  /**
   * Move files.
   *
   * @param from `globby` pattern.
   * @param to Name transform.
   */
  move (from: string, to: (file: SimpleFile) => string) {
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
   * @param filePath Path of the file in the project.
   * @param cb File transform.
   */
  modifyFile (filePath: string, cb: (content: string | Buffer) => string | Buffer | Promise<string | Buffer>) {
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
   */
  postProcessFiles (cb: FilePostProcessor) {
    this.migrationOperation.postProcessFilesCbs.push(cb)
  }

  /**
   * convenience method for generating a js config file from json
   */
  genJSConfig (value: any) {
    return `module.exports = ${stringifyJS(value)}`
  }

  /**
   * Displays a message for the user at the end of all migration operations.
   */
  addNotice (message: string, type: NoticeType = 'info') {
    this.migrationOperation.migrator.notices.push({
      pluginId: this.migrationOperation.migration.plugin.id,
      type,
      message,
    })
  }

  /**
   * Called once after migration operation is completed.
   */
  onComplete (cb: Function) {
    this.migrationOperation.completeCbs.push(cb)
  }
}

function extractCallDir () {
  // extract api.render() callsite file location using error stack
  const obj: any = {}
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
