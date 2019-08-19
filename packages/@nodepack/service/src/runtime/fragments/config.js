const files = require.context('@root', true, /^.\/config\/.*\.[jt]sx?$/)
for (const key of files.keys()) {
  const [, exportName] = /(\w+)\.[jt]sx?$/.exec(key)
  module.exports[exportName] = files(key).default
}
