import { Migration } from '../lib/Migrator'
import consola from 'consola'

export function printNoRollbackWarn (migration: Migration) {
  consola.warn(`Migration ${migration.options.id} of plugin ${migration.plugin.id} doesn't define a down operation.`)
}
