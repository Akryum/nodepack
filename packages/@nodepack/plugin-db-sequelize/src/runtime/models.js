import { pascal } from 'case'

export async function loadModels (ctx) {
  if (!ctx.models) {
    ctx.models = {}
  }
  const files = require.context('@', true, /^.\/models\/.*\.[jt]sx?$/)
  for (const key of files.keys()) {
    const module = files(key)
    const fn = module.default || module
    if (typeof fn === 'function') {
      const [, modelName] = /([a-z_-]+)\.[jt]sx?$/i.exec(key)
      ctx.models[pascal(modelName)] = fn(ctx)
    }
  }
}
