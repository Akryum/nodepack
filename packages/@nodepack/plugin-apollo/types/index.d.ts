import { DocumentNode, GraphQLResolveInfo } from 'graphql'
import { Config } from 'apollo-server-express'
import ApolloContext from './context'
export { default as ApolloContext, Schema } from './context'

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
  excludedFields: string[],
  // selectNestedFields: string[],
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
