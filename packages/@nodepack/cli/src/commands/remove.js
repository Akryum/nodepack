const { error, stopSpinner } = require('@nodepack/utils')
const PluginRemoveJob = require('../lib/PluginRemoveJob')

async function remove (pluginName, options) {
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }

  const cwd = options.cwd || process.cwd()

  const job = new PluginRemoveJob(pluginName, cwd)
  await job.remove(options)
}

module.exports = (...args) => {
  // @ts-ignore
  return remove(...args).catch(err => {
    stopSpinner(false) // do not persist
    error(err)
    if (!process.env.NODEPACK_TEST) {
      process.exit(1)
    }
  })
}
