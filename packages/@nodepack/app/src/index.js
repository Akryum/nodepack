const { createContext, callHook } = require('@nodepack/app-context')

/**
 * @param {(ctx: any) => Promise<any>} callback
 */
exports.bootstrap = async (callback) => {
  const ctx = await createContext()
  await callHook('bootstrap', ctx)
  await callback(ctx)
  return ctx
}
