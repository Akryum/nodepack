import { hook, callHook } from '@nodepack/app-context'
import cookieSession from 'cookie-session'
import { setupPassport, login, logout } from './passport'
import passport from 'passport'

hook('expressAuth', async (ctx) => {
  // Config checks
  // Base cookie config
  if (!ctx.config.cookie) {
    console.warn('⚠️ Missing cookie configuration, create a `config/cookie.js` file that exports a `cookie-session` cookie options object. See: https://github.com/expressjs/cookie-session#options')
    return
  }
  // Signing config
  if (!ctx.config.cookie.keys && !ctx.config.cookie.secret) {
    console.warn('⚠️ Please provide a `secret` or a `keys` property in the `cookie` configuration to sign & verify cookie values. See: https://github.com/expressjs/cookie-session#keys')
    return
  }

  const { express: app } = ctx

  await setupPassport(ctx)

  // Session
  const cookieOptions = Object.assign({
    name: 'user-session',
    domain: undefined,
    maxAge: 2 * 7 * 24 * 60 * 60 * 1000, // 2 weeks
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    signed: true,
  }, ctx.config.cookie)
  app.use(cookieSession(cookieOptions))

  // Passport
  app.use(passport.initialize())
  app.use(passport.session())

  // Utils
  Object.defineProperty(ctx, 'user', {
    get: () => ctx.req ? ctx.req.user : undefined,
  })
  Object.defineProperty(ctx, 'account', {
    get: () => ctx.req ? ctx.req.account : undefined,
  })
  ctx.login = (user) => login(ctx, user)
  ctx.logout = () => logout(ctx)

  await callHook('passportAfter', ctx)
})
