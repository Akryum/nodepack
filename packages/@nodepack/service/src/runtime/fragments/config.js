const files = require.context('@config', true, /\.[jt]sx?$/)
for (const key of files.keys()) {
  const [, exportName] = /(\w+)\.[jt]sx?$/.exec(key)
  module.exports[exportName] = files(key).default
}
