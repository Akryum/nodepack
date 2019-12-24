import { hook } from '@nodepack/app-context'
import { Sequelize } from 'sequelize'
import { loadModels } from './models'

let synced = false

hook('create', async (ctx) => {
  if (ctx.config.sequelize) {
    const sequelize = ctx.sequelize = new Sequelize(ctx.config.sequelize)
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
    console.warn('⚠️ No `sequelize` configuration found. Create a `config/sequelize.js` file that exports default a sequelize configuration object.')
  }
})
