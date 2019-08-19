import { DocumentNode } from 'graphql'
import { IResolvers, PubSubEngine, ApolloServer } from 'apollo-server-express'
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
