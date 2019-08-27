exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'express',
    'apollo',
    'db',
    'passport',
  ].map(file => require(`./${file}`))
}
