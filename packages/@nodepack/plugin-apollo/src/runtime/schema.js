import merge from 'lodash/merge'

/** @typedef {import('graphql').DocumentNode} DocumentNode */
/** @typedef {import('apollo-server-express').IResolvers} IResolvers */

/**
 * @param {any} ctx
 */
export async function loadSchema (ctx) {
  /** @type {DocumentNode[]} */
  const typeDefs = []
  /** @type {DocumentNode[]} */
  const internalTypeDefs = []
  /** @type {IResolvers} */
  const resolvers = {}
  /** @type {DocumentNode[]} */
  const mergeTypeDefs = []
  /** @type {IResolvers} */
  const mergeResolvers = {}

  const files = require.context('@', true, /^.\/schema\/.*\.[jt]sx?$/)
  for (const key of files.keys()) {
    let module = files(key)
    if (module.default) {
      module = module.default
    }
    if (typeof module === 'function') {
      module = await module(ctx)
    }
    if (module.typeDefs) {
      typeDefs.push(module.typeDefs)
    }
    if (module.internalTypeDefs) {
      internalTypeDefs.push(module.internalTypeDefs)
    }
    if (module.mergeTypeDefs) {
      mergeTypeDefs.push(module.mergeTypeDefs)
    }
    if (module.resolvers) {
      merge(resolvers, module.resolvers)
    }
    if (module.mergeResolvers) {
      merge(mergeResolvers, module.mergeResolvers)
    }
  }

  return {
    typeDefs,
    internalTypeDefs,
    resolvers,
    mergeTypeDefs,
    mergeResolvers,
  }
}
