/**
 * @param {string} str
 * @returns {string}
 */
exports.ensureEOL = str => {
  if (str.charAt(str.length - 1) !== '\n') {
    return str + '\n'
  }
  return str
}
