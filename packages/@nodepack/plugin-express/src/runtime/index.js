import { hook, callHook, createContext } from '@nodepack/app-context'
import http from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { password } from './password'
import { loadRoutes } from './routes'

hook('bootstrap', async (ctx) => {
  // Create express app
  await callHook('express', ctx)
  if (!ctx.express) {
    ctx.express = express()
  }

  const app = ctx.express

  // Support reverse proxy
  app.set('trust proxy', 'loopback')

  // Create hook
  await callHook('expressCreate', ctx)

  // Basic HTTP password (useful for protected environments)
  await password(app, ctx)

  // CORS
  if ('cors' in ctx.config) {
    app.use(cors(ctx.config.cors))
    await callHook('expressCors', ctx)
  }

  // Cookies
  app.use(cookieParser())

  // Setup user auth hook
  await callHook('expressAuth', ctx)

  // Request context
  app.use(async (req, res, next) => {
    const reqCtx = await createContext()
    req.ctx = res.ctx = reqCtx
    reqCtx.req = req
    reqCtx.res = res
    await callHook('expressRequest', reqCtx)
    next()
  })

  // Setup other middlewares
  await callHook('expressMiddleware', ctx)

  // Routes
  await loadRoutes(ctx)

  // HTTP
  const httpServer = ctx.httpServer = http.createServer(app)
  await callHook('expressHttp', ctx)
  const port = ctx.port = process.env.PORT

  process.on('SIGINT', () => {
    httpServer.close()
    process.exit()
  })

  hook('destroy', () => {
    httpServer.close()
  })

  hook('printReady', () => {
    // Don't print duplcates if there is a sub-server like Apollo
    if (!ctx.server) {
      console.log(`🚀  Server ready at http://localhost:${port}/`)
    }
  })

  return new Promise((resolve) => {
    if (process.env.EXPRESS_NO_LISTEN !== 'true') {
      httpServer.listen(port, async () => {
        await callHook('expressListen', ctx)
        resolve()
      })
    } else {
      resolve()
    }
  })
})
