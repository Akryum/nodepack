import { hook } from '@nodepack/app-context'
import knex from 'knex'
import { readMigrationRecords, writeMigrationRecords } from './migration'

hook('create', async (ctx) => {
  if (ctx.config.db) {
    ctx.knex = knex(ctx.config.db)
    // DB migrations
    ctx.readDbMigrationRecords = () => readMigrationRecords(ctx)
    ctx.writeDbMigrationRecords = (data) => writeMigrationRecords(ctx, data)
  } else {
    console.warn('No `db` configuration found. Create a `config/db.js` file that exports default a knex configuration object.')
  }
})
