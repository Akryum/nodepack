// proxy to joi for option validation
exports.createSchema = fn => fn(require('@hapi/joi'))

/**
 * @param {any} obj
 * @param {any} schema
 * @param {(message: string) => void} cb
 */
exports.validate = (obj, schema, cb) => {
  require('@hapi/joi').validate(obj, schema, {}, err => {
    if (err) {
      cb(err.message)
      if (process.env.NODEPACK_TEST) {
        throw err
      } else {
        process.exit(1)
      }
    }
  })
}

exports.validateSync = (obj, schema) => {
  const result = require('@hapi/joi').validate(obj, schema)
  if (result.error) {
    throw result.error
  }
}
