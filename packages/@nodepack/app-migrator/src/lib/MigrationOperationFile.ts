import fs from 'fs'
import path from 'path'
import { isBinaryFileSync } from 'isbinaryfile'

export class MigrationOperationFile {
  cwd: string
  filename: string
  _source: string | Buffer
  modified: boolean

  /**
   * @param filename Path relative to project.
   */
  constructor (cwd: string, filename: string, source: string | Buffer = null, modified = false) {
    this.cwd = cwd
    this.filename = filename
    this._source = source
    this.modified = modified
  }

  /**
   * Lazy loaded file content or modified content
   * @returns file source content
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

  move (newName: string) {
    // Copy original source
    // eslint-disable-next-line no-self-assign
    this.source = this.source
    this.filename = newName
  }
}
