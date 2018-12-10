/** @typedef {import('../lib/ServicePluginAPI.js')} PackPluginApi */
/** @typedef {import('../lib/options.js').ProjectOptions} ProjectOptions */

/**
 * @param {PackPluginApi} api
 * @param {ProjectOptions} options
 */
exports.getDefaultPort = async function (api, options, args) {
  const portfinder = require('portfinder')
  const result = await portfinder.getPortPromise({
    port: args.port || options.defaultPort,
  })
  return result
}
