import { hook } from '@nodepack/app-context'
import { Client as FaunaClient } from 'faunadb'
import { readMigrationRecords, writeMigrationRecords } from './migration'

hook('create', async (ctx) => {
  if (ctx.config.fauna) {
    ctx.fauna = new FaunaClient(ctx.config.fauna)
    if (process.env.NODEPACK_MAINTENANCE_FRAGMENTS) {
      // DB migrations
      ctx.readDbMigrationRecords = () => readMigrationRecords(ctx)
      ctx.writeDbMigrationRecords = (data) => writeMigrationRecords(ctx, data)
    }

    hook('destroy', () => {
      ctx.destroy()
    })
  } else {
    console.warn('⚠️ No `fauna` configuration found. Create a `config/fauna.js` file that exports default a FaunaDB configuration object.')
  }
})
