/** @typedef {import('../../').ProjectOptions} ProjectOptions */

const prefixRE = /^NODE_APP_/

/**
 * @param {ProjectOptions} options
 */
module.exports = function resolveClientEnv (options, raw = false) {
  const env = {}
  Object.keys(process.env).forEach(key => {
    if (prefixRE.test(key)) {
      env[key] = process.env[key]
    }
  })

  if (options.defineEnv) {
    Object.assign(env, defineEnv(options.defineEnv))
  }

  if (raw) {
    return env
  }

  for (const key in env) {
    env[`process.env.${key}`] = JSON.stringify(env[key])
  }

  return env
}

/**
 * @param {string[]} list
 */
function defineEnv (list) {
  const result = {}
  for (const key of list) {
    result[`process.env.${key}`] = JSON.stringify(process.env[key])
  }
  return result
}
