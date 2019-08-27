exports.useStrategy = (strategy, setupRoutes = null) => {
  const { hook } = require('@nodepack/app-context')
  const passport = require('passport')
  hook('passportStrategy', async (ctx) => {
    passport.use(strategy)
  })
  hook('passportAfter', async (ctx) => {
    if (typeof setupRoutes === 'function') {
      await setupRoutes(ctx)
    }
  })
}

exports.serializeUser = (callback) => {
  const { hook } = require('@nodepack/app-context')
  hook('passportSerializeUser', async (ctx, payload) => {
    const result = await callback(ctx, payload)
    if (result != null) {
      payload.serialized = result
    }
  })
}

exports.deserializeUser = (callback) => {
  const { hook } = require('@nodepack/app-context')
  hook('passportDeserializeUser', async (ctx, payload) => {
    const result = await callback(ctx, payload)
    if (result != null) {
      payload.user = result
    }
  })
}
