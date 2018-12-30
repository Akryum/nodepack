exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
  ].map(file => require(`./${file}`))
}
