import { callHook, createContext } from '@nodepack/app-context'
import { createDefaultPubsub } from './pubsub'

export async function getApolloConfig ({
  ctx,
  apolloConfig,
  localSchema,
  onSubConnect,
}) {
  // PubSub for subscriptions
  const pubsub = ctx.config.pubsub || createDefaultPubsub()

  return {
    schema: localSchema,
    context: async (context) => {
      let user
      if (context.req) {
        // @ts-ignore
        user = context.req.user
      } else if (context.connection) {
        user = context.connection.context.user
      }
      const reqCtx = await createContext()
      reqCtx.user = user
      reqCtx.rawContext = context
      reqCtx.req = context.req
      reqCtx.res = context.res
      reqCtx.connection = context.connection
      reqCtx.pubsub = pubsub
      await callHook('apolloRequest', reqCtx)
      return reqCtx
    },
    tracing: true,
    introspection: true,
    subscriptions: {
      path: apolloConfig.apolloServerOptions.subscriptionsPath || '/subscriptions',
      /**
       * @param {any} connection
       */
      onConnect: async (connection, websocket) => {
        // @ts-ignore
        const req = websocket.upgradeReq
        if (onSubConnect) {
          await onSubConnect(connection, websocket)
        }
        return {
          ...connection.context,
          user: req.user,
        }
      },
    },
    ...apolloConfig.apolloServerOptions || {},
    playground: false,
  }
}

export function printReady (ctx) {
  console.log(`🚀  Server ready at http://localhost:${ctx.port}${ctx.server.graphqlPath}`)
  console.log(`⚡  Subs ready at ws://localhost:${ctx.port}${ctx.server.subscriptionsPath}`)
  if (ctx.playgroundRoute) {
    console.log(`🎮️  Playground ready at http://localhost:${ctx.port}${ctx.playgroundRoute}`)
  }
}
