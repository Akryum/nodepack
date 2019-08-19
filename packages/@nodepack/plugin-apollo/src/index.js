/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  if (api.hasPlugin('express')) {
    api.addRuntimeModule('./runtime/apollo-express.js')
  } else {
    throw new Error(`You need @nodepack/plugin-express with Apollo. Other options not yet supported.`)
  }
}
