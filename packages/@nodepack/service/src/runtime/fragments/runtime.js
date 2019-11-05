// Auto-load context files in user project
const files = require.context('@/context', true, /\.(js|ts)$/)
for (const key of files.keys()) {
  files(key)
}
