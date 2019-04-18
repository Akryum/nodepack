/** @typedef {import('../../').ProjectOptions} ProjectOptions */

const prefixRE = /^NODE_APP_/
const includedKeys = [
  'NODE_ENV',
  'NODEPACK_ENV',
]

/**
 * @param {ProjectOptions} options
 */
module.exports = function resolveClientEnv (options, raw = false) {
  const env = {}
  Object.keys(process.env).forEach(key => {
    if (prefixRE.test(key) || includedKeys.includes(key)) {
      env[key] = process.env[key]
    }
  })

  if (options.defineEnv) {
    Object.assign(env, defineEnv(options.defineEnv))
  }

  if (raw) {
    return env
  }

  const result = {}
  for (const key in env) {
    result[`process.env.${key}`] = JSON.stringify(env[key])
  }

  return result
}

/**
 * @param {string[]} list
 */
function defineEnv (list) {
  const result = {}
  for (const key of list) {
    result[key] = JSON.stringify(process.env[key])
  }
  return result
}
