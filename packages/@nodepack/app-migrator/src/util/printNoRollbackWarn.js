/** @typedef {import('../lib/Migrator').Migration} Migration */

const { warn } = require('@nodepack/utils')

/**
 * @param {Migration} migration
 */
module.exports = function (migration) {
  warn(`Migration ${migration.options.id} of plugin ${migration.plugin.id} doesn't defined a rollback operation.`)
}
