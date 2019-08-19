export async function loadRoutes (ctx) {
  const files = require.context('@', true, /^.\/routes\/.*\.[jt]sx?$/)
  for (const key of files.keys()) {
    const module = files(key)
    const fn = module.default || module
    if (typeof fn === 'function') {
      fn(ctx)
    }
  }
}
