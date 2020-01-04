import { hook, addProp } from '@nodepack/app-context'
import { Sequelize } from 'sequelize'
import { loadModels } from './models'

let synced = false

hook('create', async (ctx) => {
  if (ctx.config.sequelize) {
    addProp(ctx, 'sequelize', () => new Sequelize(ctx.config.sequelize))
    addProp(ctx, 'models', () => loadModels(ctx))

    // Sync models for development
    if (ctx.config.syncModels && !synced) {
      synced = true
      let options
      if (typeof ctx.config.syncModels === 'object') {
        options = ctx.config.syncModels
      }
      await ctx.sequelize.sync(options)
    }

    hook('destroy', () => {
      ctx.sequelize.close()
    })
  } else {
    console.warn('⚠️ No `sequelize` configuration found. Create a `config/sequelize.js` file that exports default a sequelize configuration object.')
  }
})
