// Auto-load context files in user project
const contextFiles = require.context('@/context', true, /\.(js|ts)$/)
for (const key of contextFiles.keys()) {
  contextFiles(key)
}
