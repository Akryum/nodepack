const prefixRE = /^NODE_APP_/

module.exports = function resolveClientEnv (options, raw) {
  const env = {}
  Object.keys(process.env).forEach(key => {
    if (prefixRE.test(key)) {
      env[key] = process.env[key]
    }
  })

  if (raw) {
    return env
  }

  for (const key in env) {
    env[`process.env.${key}`] = JSON.stringify(env[key])
  }

  return env
}
