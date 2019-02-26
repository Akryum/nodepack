const fs = require('fs')
const path = require('path')
const { isBinaryFileSync } = require('isbinaryfile')

module.exports = class MigrationOperationFile {
  /**
   * @param {string} cwd
   * @param {string} filename Path relative to project.
   * @param {string | Buffer?} source
   * @param {boolean} modified
   */
  constructor (cwd, filename, source = null, modified = false) {
    this.cwd = cwd
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
      const filePath = path.resolve(this.cwd, this.filename)
      this._source = isBinaryFileSync(filePath)
        ? fs.readFileSync(filePath)
        : fs.readFileSync(filePath, 'utf-8')
    }
    return this._source
  }

  set source (value) {
    this._source = value
    this.modified = true
  }

  move (newName) {
    // Copy original source
    this.source = this.source
    this.filename = newName
  }
}
