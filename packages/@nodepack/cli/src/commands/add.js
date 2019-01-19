const { error, stopSpinner } = require('@nodepack/utils')
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
    error(err)
    if (!process.env.NODEPACK_TEST) {
      process.exit(1)
    }
  })
}
