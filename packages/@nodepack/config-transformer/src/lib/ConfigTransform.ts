import { transforms, Transform } from './configTransforms'

export type PossibleFiles = string[]

export type FileDescriptor = { [key: string]: PossibleFiles }

export interface ConfigTransformOptions {
  /**
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
  file: FileDescriptor
}

export interface ConfigFileDescriptor {
  type: string
  filename: string
}

export class ConfigTransform {
  fileDescriptor: FileDescriptor

  constructor (options: ConfigTransformOptions) {
    this.fileDescriptor = options.file
  }

  /**
   * @param checkExisting read existing config if any
   * @param files project files (path: content)
   */
  getTransform (checkExisting: boolean, files: { [key: string]: any }) {
    let file: ConfigFileDescriptor = null
    if (checkExisting) {
      file = this.findFile(files)
    }
    if (!file) {
      file = this.getDefaultFile()
    }
    const { type, filename } = file

    const transform: Transform = transforms[type]

    return {
      filename,
      transform,
    }
  }

  /**
   * @param value new value
   * @param checkExisting read existing config if any
   * @param files project files (path: content)
   * @param cwd working directory
   */
  transform (value: any, checkExisting: boolean, files: { [key: string]: any }, cwd: string) {
    const { filename, transform } = this.getTransform(checkExisting, files)

    let source: string = null
    let existing
    if (checkExisting) {
      const file = files[filename]
      if (file) {
        source = file.source
      }
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
   * @param files project files (path: content)
   */
  findFile (files: { [key: string]: any }): ConfigFileDescriptor {
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

  getDefaultFile (): ConfigFileDescriptor {
    const [type] = Object.keys(this.fileDescriptor)
    const [filename] = this.fileDescriptor[type]
    return { type, filename }
  }
}
