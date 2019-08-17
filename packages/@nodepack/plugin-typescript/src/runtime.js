import { hook } from '@nodepack/app-context'

hook('create', ctx => {
  ctx.usesTypeScript = true
})
