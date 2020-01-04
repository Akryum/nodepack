// @ts-check

/** @typedef {import('graphql').GraphQLResolveInfo} GraphQLResolveInfo */
/** @typedef {import('graphql').FieldNode} FieldNode */
/** @typedef {import('..').ApolloContext} Context */
/** @typedef {import('..').RequestedField} RequestedField */
/** @typedef {import('..').CustomField} CustomField */

const SKIPPED_FIELDS = ['__typename']

/**
 * @param {Context} ctx
 * @param {GraphQLResolveInfo} info
 * @param {string[]} excludedFields
 * @returns {RequestedField[]}
 */
exports.getRequestedFields = function (
  ctx,
  info,
  excludedFields = [],
  // selectNestedFields: string[] = [],
) {
  /** @type {any} */
  const returnType = info.returnType
  const resolvers = ctx.schema.resolvers[returnType.name] || {}
  let fields = getSelectedNodes(info.fieldNodes, info.fieldName)
  // Selection of a nested field
  // @TODO resolve nested types
  // for (const nestedField of selectNestedFields) {
  //   fields = getSelectedNodes(fields, nestedField)
  // }
  // Excluded fields
  excludedFields = [...SKIPPED_FIELDS, ...excludedFields]
  fields = fields.filter((node) => !excludedFields.includes(node.name.value))
  // Map to RequestedField[]
  return fields.map((selection) => ({
    name: selection.name.value,
    type: resolvers[selection.name.value] ? 'computed' : 'simple',
  }))
}

/**
 * @param {ReadonlyArray<FieldNode>} fieldNodes
 * @param {string} targetNodeName
 * @returns {FieldNode[]}
 */
function getSelectedNodes (
  fieldNodes,
  targetNodeName,
) {
  /** @type {any} */
  const node = fieldNodes.find((o) => o.name.value === targetNodeName)
  return node.selectionSet.selections.filter(
    (selection) => selection.kind === 'Field',
  )
}

/**
 * @param {Context} ctx
 * @param {GraphQLResolveInfo} info
 */
exports.shouldQueryData = function (ctx, info) {
  const fields = exports.getRequestedFields(ctx, info)
  return fields.some((field) => field.type === 'simple' && field.name !== 'id')
}

/**
 * @param {CustomField[]} fields
 * @param {string} id
 * @returns {CustomField}
 */
exports.getCustomField = function (fields, id) {
  const field = fields.find(
    (f) => f.id === id,
  )
  if (field) {
    return field.value
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Field id='${id}' not found in fields`, fields.map((f) => f.id))
    }
    return null
  }
}

exports.ApolloError = require('apollo-server-express').ApolloError
