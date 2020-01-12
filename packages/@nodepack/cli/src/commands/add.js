const { stopSpinner } = require('@nodepack/utils')
const consola = require('consola')
const PluginAddJob = require('../lib/PluginAddJob')

async function add (pluginName, options) {
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }

  const cwd = options.cwd || process.cwd()

  const job = new PluginAddJob(pluginName, cwd)
  await job.add(options)
}

module.exports = (...args) => {
  // @ts-ignore
  return add(...args).catch(err => {
    stopSpinner(false) // do not persist
    consola.error(`Could not add plugin`, err.stack || err)
    if (!process.env.NODEPACK_TEST) {
      process.exit(1)
    }
  })
}
