import { hook } from '@nodepack/app-context'
import { Client as FaunaClient } from 'faunadb'
import { readMigrationRecords, writeMigrationRecords } from './migration'

hook('create', async (ctx) => {
  if (ctx.config.db) {
    ctx.fauna = new FaunaClient(ctx.config.db)
    // DB migrations
    ctx.readDbMigrationRecords = () => readMigrationRecords(ctx)
    ctx.writeDbMigrationRecords = (data) => writeMigrationRecords(ctx, data)

    hook('destroy', () => {
      ctx.destroy()
    })
  } else {
    console.warn('⚠️ No `db` configuration found. Create a `config/db.js` file that exports default a FaunaDB configuration object.')
  }
})
