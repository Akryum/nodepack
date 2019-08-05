const { loadModule } = require('@nodepack/module')
const path = require('path')

const cwd = process.env.NODEPACK_DIRNAME || process.cwd()
const moduleFile = path.join(cwd, 'config.js')

/** @type {import('@nodepack/app-config').Config} */
module.exports = loadModule(moduleFile, cwd)
