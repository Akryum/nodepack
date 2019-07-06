const launch = require('launch-editor')

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

exports.openInEditor = (...args) => {
  const file = args[0]
  console.log(`Opening ${file}...`)
  let cb = args[args.length - 1]
  if (typeof cb !== 'function') {
    cb = null
  }
  launch(...args, (fileName, errorMessage) => {
    console.error(`Unable to open '${fileName}'`, errorMessage)
    console.log(`Try setting the EDITOR env variable. More info: https://github.com/yyx990803/launch-editor`)

    if (cb) cb(fileName, errorMessage)
  })
}
