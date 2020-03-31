import { DocumentNode } from 'graphql'
import { Request, Response } from 'express'
import { ExecutionParams } from 'subscriptions-transport-ws'
import { IResolvers, PubSubEngine, ApolloServer } from 'apollo-server-express'

export interface Schema {
  typeDefs: DocumentNode[]
  resolvers: IResolvers
  internalTypeDefs: DocumentNode[]
  mergeTypeDefs: DocumentNode[]
  mergeResolvers: IResolvers
  schemaDirectives: { [key: string]: any }
}

export default interface ApolloContext {
  schema: Schema
  req: Request
  res: Response
  connection: ExecutionParams
  pubsub: PubSubEngine
  server: ApolloServer
}
