/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  api.addRuntimeModule('./runtime/index.js')
}

Object.assign(module.exports, require('sequelize'))
