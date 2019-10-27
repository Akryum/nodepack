/**
 * @param {string} json
 */
exports.removeTrailingComma = function (json) {
  return json.replace(/,(?!\s*?[{["'/\w])/g, '')
}
