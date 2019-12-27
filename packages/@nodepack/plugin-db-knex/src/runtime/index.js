import { hook } from '@nodepack/app-context'
import knex from 'knex'
import { readMigrationRecords, writeMigrationRecords } from './migration'

hook('create', async (ctx) => {
  if (ctx.config.knex) {
    ctx.knex = knex(ctx.config.knex)
    if (process.env.NODEPACK_MAINTENANCE_FRAGMENTS) {
      // DB migrations
      ctx.readDbMigrationRecords = () => readMigrationRecords(ctx)
      ctx.writeDbMigrationRecords = (data) => writeMigrationRecords(ctx, data)
    }

    hook('destroy', () => {
      ctx.destroy()
    })
  } else {
    console.warn('⚠️ No `knex` configuration found. Create a `config/knex.js` file that exports default a knex configuration object.')
  }
})
