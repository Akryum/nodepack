exports.getPromptModules = () => {
  return [
    // 'typescript',
    // 'linter',
    // 'unit',
    // 'e2e'
  ].map(file => require(`../lib/promptModules/${file}`))
}
