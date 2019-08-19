exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'express',
    'apollo',
  ].map(file => require(`./${file}`))
}
