/** @type {import('@nodepack/service').ServicePlugin} */
module.exports = (api, options) => {
  if (api.hasPlugin('express')) {
    api.addRuntimeModule('./runtime/express.js')
  } else {
    console.warn(`⚠️ Passport plugin is currently only compatible with express plugin.`)
  }
}

Object.assign(module.exports, require('./helpers'))
