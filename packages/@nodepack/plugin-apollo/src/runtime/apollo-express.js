import { hook, callHook } from '@nodepack/app-context'
import { loadSchema } from './schema'
import { makeExecutableSchema, ApolloServer } from 'apollo-server-express'
import MockExpressResponse from '@akryum/mock-express-response'
import expressPlayground from 'graphql-playground-middleware-express'
import { getApolloConfig, printReady } from './server'

hook('expressHttp', async (ctx) => {
  const { config, express: app, httpServer } = ctx
  const apolloConfig = config.apollo || {}

  // Load schema
  const fullSchema = ctx.schema = await loadSchema(ctx)

  await callHook('apolloSchema', ctx)

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

  // Express middleware
  const graphqlPath = apolloConfig.path || '/graphql'
  server.setGraphQLPath(graphqlPath)
  app.use(server.getMiddleware({
    path: graphqlPath,
    cors: config.cors,
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

  // Subscriptions
  server.installSubscriptionHandlers(httpServer)

  // Listen hook
  hook('expressListen', async (ctx) => {
    await callHook('apolloListen', ctx)
  })

  hook('printReady', () => {
    printReady(ctx)
  })
})
