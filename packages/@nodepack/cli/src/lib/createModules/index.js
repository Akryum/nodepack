exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'eslint',
    'express',
    'apollo',
    'db',
    'passport',
  ].map(file => require(`./${file}`))
}
