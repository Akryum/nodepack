// this file is for cases where we need to access the
// webpack config as a file when using CLI commands.

const deasync = require('deasync')

async function resolve (cb) {
  try {
    /** @type {import('./src/lib/Service')} */
    // @ts-ignore
    let service = process.NODEPACK_SERVICE

    if (!service || process.env.NODEPACK_API_MODE) {
      const Service = require('./src/lib/Service')
      service = new Service(process.env.NODEPACK_CONTEXT || process.cwd())
      await service.init(process.env.NODEPACK_ENV || process.env.NODE_ENV || 'development')
    }

    const config = await service.resolveWebpackConfig()
    cb(null, config)
  } catch (e) {
    cb(e, null)
  }
}

const resolveWebpackConfig = deasync(resolve)
module.exports = resolveWebpackConfig()
