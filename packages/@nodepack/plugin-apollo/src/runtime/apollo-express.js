import { hook, callHook } from '@nodepack/app-context'
import { loadSchema } from './schema'
import { makeExecutableSchema, ApolloServer } from 'apollo-server-express'
import MockExpressResponse from '@akryum/mock-express-response'
import expressPlayground from 'graphql-playground-middleware-express'
import { getApolloConfig, printReady } from './server'

hook('express-http', async (ctx) => {
  const { config, express: app, httpServer } = ctx
  const apolloConfig = config.apollo || {}

  // Load schema
  const fullSchema = ctx.schema = await loadSchema(ctx)

  await callHook('apollo-schema', ctx)

  const localSchema = makeExecutableSchema({
    typeDefs: fullSchema.typeDefs,
    resolvers: fullSchema.resolvers,
  })

  // Apollo Server
  const server = ctx.server = new ApolloServer(await getApolloConfig({
    ctx,
    apolloConfig,
    localSchema,
    onSubConnect: (connection, websocket) => {
      return new Promise((resolve, reject) => {
        const req = websocket.upgradeReq
        // @ts-ignore
        app.handle(req, new MockExpressResponse(), (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    },
  }))

  // GraphQL Playground
  if (apolloConfig.playground !== false) {
    const playgroundRoute = ctx.playgroundRoute =
      typeof apolloConfig.playground === 'string' ? apolloConfig.playground : '/playground'
    app.get(playgroundRoute, expressPlayground({
      endpoint: server.graphqlPath,
      subscriptionEndpoint: server.subscriptionsPath,
    }))
  }

  // Express middleware
  server.applyMiddleware({
    app,
    cors: config.cors,
  })

  // Subscriptions
  server.installSubscriptionHandlers(httpServer)

  // Listen hook
  hook('express-listen', async (ctx) => {
    await callHook('apollo-listen', ctx)
  })

  hook('print-ready', () => {
    printReady(ctx)
  })
})
