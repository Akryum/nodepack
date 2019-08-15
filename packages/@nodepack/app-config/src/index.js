const { loadFragment } = require('@nodepack/fragment')

/** @type {import('@nodepack/app-config').Config} */
module.exports = loadFragment('config.js')
