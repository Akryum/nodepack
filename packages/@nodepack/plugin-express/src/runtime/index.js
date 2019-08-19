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
  await callHook('express-create', ctx)

  // Basic HTTP password (useful for protected environments)
  await password(app, ctx)

  // CORS
  if ('cors' in ctx.config) {
    app.use(cors(ctx.config.cors))
    await callHook('express-cors', ctx)
  }

  // Cookies
  app.use(cookieParser())

  // Setup user auth hook
  await callHook('express-auth', ctx)

  // Request context
  app.use(async (req, res, next) => {
    const reqCtx = await createContext()
    req.ctx = res.ctx = reqCtx
    reqCtx.req = req
    reqCtx.res = res
    await callHook('express-request', reqCtx)
    next()
  })

  // Routes
  await loadRoutes(ctx)

  // HTTP
  const httpServer = ctx.httpServer = http.createServer(app)
  await callHook('express-http', ctx)
  const port = ctx.port = process.env.PORT
  process.on('SIGINT', () => {
    httpServer.close()
    process.exit()
  })
  return new Promise((resolve) => {
    httpServer.listen(port, async () => {
      await callHook('express-listen', ctx)
      resolve()
    })
  })
})
