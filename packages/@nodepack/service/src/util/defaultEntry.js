/** @typedef {import('../lib/ServicePluginAPI.js')} PackPluginApi */
/** @typedef {import('../lib/options.js').ProjectOptions} ProjectOptions */

const config = exports.config = {
  defaultEntry: 'index.js',
}

/**
 * @param {PackPluginApi} api
 * @param {ProjectOptions} options
 * @param {any} args
 * @returns {string}
 */
exports.getDefaultEntry = (api, options, args) => {
  if (args._ && typeof args._[0] === 'string') {
    return args._[0]
  } else if (!options.entry) {
    const path = require('path')
    return path.resolve((options.srcDir && api.resolve(options.srcDir)) || api.resolve('src'), config.defaultEntry)
  } else {
    return options.entry
  }
}
