import { DocumentNode } from 'graphql'
import { IResolvers, PubSubEngine, ApolloServer, Config } from 'apollo-server-express'
import { ExecutionParams } from 'subscriptions-transport-ws'
import { Request, Response } from 'express'

export interface Schema {
  typeDefs: DocumentNode
  resolvers: IResolvers
  internalTypeDefs: DocumentNode
  mergeTypeDefs: DocumentNode
  mergeResolvers: IResolvers
}

export interface ApolloContext {
  schema: Schema
  req: Request
  res: Response
  connection: ExecutionParams
  pubsub: PubSubEngine
  user: any
  server: ApolloServer
}

export interface ApolloConfig {
  path: string
  subscriptionsPath: string
  playground: boolean | string
  apolloServerOptions: Config
}
