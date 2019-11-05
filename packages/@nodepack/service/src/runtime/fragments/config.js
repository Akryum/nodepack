const configFiles = require.context('@root', true, /^.\/config\/.*\.[jt]sx?$/)
for (const key of configFiles.keys()) {
  const configModule = configFiles(key)

  // Default export
  const [, exportName] = /(\w+)\.[jt]sx?$/.exec(key)
  module.exports[exportName] = configModule.default

  // Non-default exports
  for (const secondaryKey of Object.keys(configModule)) {
    if (secondaryKey === 'default') continue
    module.exports[secondaryKey] = configModule[secondaryKey]
  }
}
