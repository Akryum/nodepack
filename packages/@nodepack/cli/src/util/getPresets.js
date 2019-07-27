const {
  loadGlobalOptions,
  defaultGlobalOptions,
} = require('@nodepack/utils')

exports.getPresets = function () {
  const savedOptions = loadGlobalOptions()
  return Object.assign({}, savedOptions.presets, defaultGlobalOptions.presets)
}
