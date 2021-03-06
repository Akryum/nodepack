import merge from 'deepmerge'
import { loadModule } from '@nodepack/module'
import { extendJSConfig } from './extendJSConfig'
import { stringifyJS } from './stringifyJS'

export interface ReadOptions {
  filename?: string
  cwd?: string
  source?: string
}

export interface WriteOptions {
  value: any
  existing: any
  source?: string | null
}

export interface Transform {
  read: (options: ReadOptions) => any
  write: (options: WriteOptions) => string
}

const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))
const mergeOptions = {
  arrayMerge: mergeArrayWithDedupe,
}

const isObject = val => val && typeof val === 'object'

const transformJS: Transform = {
  read: ({ filename, cwd }) => {
    try {
      return loadModule(filename, cwd, true)
    } catch (e) {
      return null
    }
  },
  write: ({ value, existing, source }) => {
    if (existing) {
      // We merge only the modified keys
      const changedData = {}
      Object.keys(value).forEach(key => {
        const originalValue = existing[key]
        const newValue = value[key]
        if (Array.isArray(originalValue) && Array.isArray(newValue)) {
          changedData[key] = mergeArrayWithDedupe(originalValue, newValue)
        } else if (isObject(originalValue) && isObject(newValue)) {
          changedData[key] = merge(originalValue, newValue, mergeOptions)
        } else {
          changedData[key] = newValue
        }
      })
      return extendJSConfig(changedData, source)
    } else {
      return `module.exports = ${stringifyJS(value)}`
    }
  },
}

const transformJSON: Transform = {
  read: ({ source }) => JSON.parse(source),
  write: ({ value, existing }) => {
    return JSON.stringify(merge(existing, value, mergeOptions), null, 2)
  },
}

const transformYAML: Transform = {
  read: ({ source }) => require('js-yaml').safeLoad(source),
  write: ({ value, existing }) => {
    return require('js-yaml').safeDump(merge(existing, value, mergeOptions), {
      skipInvalid: true,
    })
  },
}

const transformLines: Transform = {
  read: ({ source }) => source.split('\n'),
  write: ({ value, existing }) => {
    if (existing) {
      value = existing.concat(value)
      // Dedupe
      value = value.filter((item, index) => value.indexOf(item) === index)
    }
    return value.join('\n')
  },
}

export const transforms = {
  js: transformJS,
  json: transformJSON,
  yaml: transformYAML,
  lines: transformLines,
}
