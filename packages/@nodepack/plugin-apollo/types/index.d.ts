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
  schemaDirectives: { [key: string]: any }
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

export interface RequestedField {
  name: string
  type: 'simple' | 'computed'
}

export function getRequestedFields (
  ctx: ApolloContext,
  info: GraphQLResolveInfo,
  excludedFields: string[] = [],
  // selectNestedFields: string[] = [],
): RequestedField[]

export function shouldQueryData (
  ctx: ApolloContext,
  info: GraphQLResolveInfo,
): boolean

export interface CustomField {
  id: string
  value: any
}

export function getCustomField (
  fields: CustomField[],
  id: string
): CustomField
