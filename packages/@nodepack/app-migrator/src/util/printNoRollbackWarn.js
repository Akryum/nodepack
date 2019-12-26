/** @typedef {import('../lib/Migrator').Migration} Migration */

const consola = require('consola')

/**
 * @param {Migration} migration
 */
module.exports = function (migration) {
  consola.warn(`Migration ${migration.options.id} of plugin ${migration.plugin.id} doesn't define a down operation.`)
}
