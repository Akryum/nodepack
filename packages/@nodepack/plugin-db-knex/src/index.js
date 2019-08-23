/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  api.addRuntimeModule('./runtime/index.js')
}
