exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'express',
    'apollo',
    'db',
  ].map(file => require(`./${file}`))
}
