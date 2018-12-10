const fs = require('fs')
const isBinary = require('isbinaryfile')

module.exports = class GeneratorFile {
  /**
   * @param {string} filename
   * @param {string | Buffer?} source
   * @param {boolean} modified
   */
  constructor (filename, source = null, modified = false) {
    this.filename = filename
    this._source = source
    this.modified = modified
  }

  /**
   * Lazy loaded file content or modified content
   * @returns {string | Buffer} file source content
   */
  get source () {
    if (!this._source) {
      this._source = isBinary.sync(name)
        ? fs.readFileSync(name)
        : fs.readFileSync(name, 'utf-8')
    }
    return this._source
  }

  set source (value) {
    this._source = value
    this.modified = true
  }
}
