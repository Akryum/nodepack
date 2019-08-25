const { createContext, callHook } = require('@nodepack/app-context')

/**
 * @param {(ctx?: any) => Promise<void> | void} callback
 */
exports.bootstrap = async (callback = null) => {
  const ctx = await createContext()
  await callHook('bootstrap', ctx)
  if (callback) {
    await callback(ctx)
  }
  return ctx
}

exports.printReady = async () => {
  await callHook('printReady')
}
