import Config from '@nodepack/app-config'
import { hook } from '@nodepack/app-context'

hook('create', ctx => {
  ctx.config = Config
})
