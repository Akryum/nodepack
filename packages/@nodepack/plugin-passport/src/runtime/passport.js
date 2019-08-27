import { callHook, callHookWithPayload } from '@nodepack/app-context'
import passport from 'passport'

export async function setupPassport (ctx) {
  await callHook('passportStrategy', ctx)

  passport.serializeUser(async (user, done) => {
    try {
      const { serialized } =
        await callHookWithPayload('passportSerializeUser', ctx, {
          user,
          serialized: user.id,
        })
      done(null, serialized)
    } catch (e) {
      done(e)
    }
  })

  passport.deserializeUser(async (serialized, done) => {
    try {
      const { user } =
        await callHookWithPayload('passportDeserializeUser', ctx, {
          user: null,
          serialized,
        })
      if (!user) {
        done(null, false)
      }
      done(null, user)
    } catch (e) {
      done(e)
    }
  })
}

export function login (ctx, user) {
  return new Promise((resolve, reject) => {
    if (!ctx.req) {
      reject(new Error(`Loading called in non-request context`))
      return
    }
    ctx.req.login(user, (err) => {
      if (err) {
        reject(err)
      } else {
        ctx.user = ctx.req.user
        resolve()
      }
    })
  })
}

export function logout (ctx) {
  return new Promise((resolve, reject) => {
    if (!ctx.req) {
      reject(new Error(`Loading called in non-request context`))
      return
    }
    ctx.req.logout()
    resolve()
  })
}
