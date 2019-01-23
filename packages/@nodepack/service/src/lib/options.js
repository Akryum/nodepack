/** @typedef {import('webpack-chain')} Config */
/** @typedef {import('../../types/ProjectOptions').ProjectOptions} ProjectOptions */

/**
 * @returns {ProjectOptions}
 */
exports.defaultOptions = function () {
  return {
    outputDir: 'dist',
    srcDir: 'src',
    productionSourceMap: false,
    externals: false,
    minify: true,
    parallel: hasMultipleCores(),
    transpileDependencies: [],
    defaultPort: 4000,
  }
}

// #2110
// https://github.com/nodejs/node/issues/19022
// in some cases cpus() returns undefined, and may simply throw in the future
function hasMultipleCores () {
  try {
    return require('os').cpus().length > 1
  } catch (e) {
    return false
  }
}
