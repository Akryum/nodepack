const { error, stopSpinner } = require('@nodepack/utils')
const PluginUpgradeJob = require('../lib/PluginUpgradeJob')

async function upgrade (plugins, options) {
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }

  const cwd = options.cwd || process.cwd()

  const job = new PluginUpgradeJob(plugins, cwd)
  await job.upgrade(options)
}

module.exports = (...args) => {
  // @ts-ignore
  return upgrade(...args).catch(err => {
    stopSpinner(false) // do not persist
    error(err)
    if (!process.env.NODEPACK_TEST) {
      process.exit(1)
    }
  })
}
