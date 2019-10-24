import { hook } from '@nodepack/app-context'
import { Sequelize } from 'sequelize'
import { loadModels } from './models'

let synced = false

hook('create', async (ctx) => {
  if (ctx.config.db) {
    const sequelize = ctx.sequelize = new Sequelize(ctx.config.db)
    loadModels(ctx)

    // Sync models for development
    if (ctx.config.syncModels && !synced) {
      synced = true
      let options
      if (typeof ctx.config.syncModels === 'object') {
        options = ctx.config.syncModels
      }
      await sequelize.sync(options)
    }

    hook('destroy', () => {
      sequelize.close()
    })
  } else {
    console.warn('⚠️ No `db` configuration found. Create a `config/db.js` file that exports default a sequelize configuration object.')
  }
})
