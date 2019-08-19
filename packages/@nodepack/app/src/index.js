const { callHook } = require('@nodepack/app-context')

/**
 * @param {function} callback
 */
exports.bootstrap = async (callback) => {
  await callHook('bootstrap')
  await callback()
}
