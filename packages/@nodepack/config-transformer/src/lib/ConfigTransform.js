/** @typedef {import('./configTransforms').Transform} Transform */

const transforms = require('./configTransforms')

/**
 * @typedef {string []} FileDescriptors
 */
/**
 * @typedef ConfigTransformOptions
 * @prop {Object.<string, FileDescriptors>} file
 * Used to search for existing file.
 * Each key is a file type (possible values: `['js', 'json', 'yaml', 'lines']`).
 * The value is a list of filenames.
 *
 * Example:
 *
 * ```js
 {
   js: ['.eslintrc.js'],
   json: ['.eslintrc.json', '.eslintrc']
 }
 ```
 *
 * By default, the first filename will be used to create the config file.
 */
/**
 * @typedef ConfigFileDescriptor
 * @prop {string} type
 * @prop {string} filename
 */

class ConfigTransform {
  /**
   * @param {ConfigTransformOptions} options
   */
  constructor (options) {
    this.fileDescriptor = options.file
  }

  /**
   * @param {boolean} checkExisting read existing config if any
   * @param {Object.<string, any>} files project files (path: content)
   */
  getTransform (checkExisting, files) {
    /** @type {ConfigFileDescriptor?} */
    let file = null
    if (checkExisting) {
      file = this.findFile(files)
    }
    if (!file) {
      file = this.getDefaultFile()
    }
    const { type, filename } = file

    /** @type {Transform} */
    const transform = transforms[type]

    return {
      filename,
      transform,
    }
  }

  /**
   * @param {any} value new value
   * @param {boolean} checkExisting read existing config if any
   * @param {Object.<string, any>} files project files (path: content)
   * @param {string} cwd working directory
   */
  transform (value, checkExisting, files, cwd) {
    const { filename, transform } = this.getTransform(checkExisting, files)

    /** @type {string?} */
    let source = null
    let existing
    if (checkExisting) {
      source = files[filename].source
      if (source) {
        existing = transform.read({
          source,
          filename,
          cwd,
        })
      }
    }

    const content = transform.write({
      source,
      value,
      existing,
    })

    return {
      filename,
      content,
    }
  }

  /**
   * @param {Object.<string, any>} files project files (path: content)
   * @returns {ConfigFileDescriptor?}
   */
  findFile (files) {
    for (const type of Object.keys(this.fileDescriptor)) {
      const descriptors = this.fileDescriptor[type]
      for (const filename of descriptors) {
        if (files[filename]) {
          return { type, filename }
        }
      }
    }
    return null
  }

  /**
   * @returns {ConfigFileDescriptor}
   */
  getDefaultFile () {
    const [type] = Object.keys(this.fileDescriptor)
    const [filename] = this.fileDescriptor[type]
    return { type, filename }
  }
}

module.exports = ConfigTransform
