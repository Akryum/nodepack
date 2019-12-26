import { stringify } from 'javascript-stringify'

export function stringifyJS (value: any) {
  return stringify(value, (val, indent, stringify) => {
    if (val && val.__expression) {
      return val.__expression
    }
    return stringify(val)
  }, 2)
}
