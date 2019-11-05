// Auto-load context files in user project
const contextFiles = require.context('@', true, /^.\/context\/.*\.[jt]sx?$/)
for (const key of contextFiles.keys()) {
  contextFiles(key)
}
