exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'express',
  ].map(file => require(`./${file}`))
}
