/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  const featureName = 'ESLint'

  api.injectFeature({
    name: featureName,
    value: 'eslint',
    // @ts-ignore
    description: 'Add code quality & style checking with ESLint',
    link: 'https://github.com/Akryum/nodepack/tree/dev/packages/%40nodepack/plugin-eslint',
  })

  api.injectPrompt({
    name: 'eslintConfig',
    when: answers => answers.features.includes('eslint'),
    type: 'list',
    message: `Pick an ESLint config:`,
    choices: [
      {
        name: 'Error prevention only',
        value: 'base',
      },
      {
        name: 'Airbnb',
        value: 'airbnb',
      },
      {
        name: 'Standard',
        value: 'standard',
      },
      {
        name: 'Prettier',
        value: 'prettier',
      },
    ],
    // @ts-ignore
    group: featureName,
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('eslint')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-eslint'] = ''

      const appMigrations = preset.appMigrations['@nodepack/plugin-eslint'] = {
        defaultTemplate: {},
      }
      if (answers.eslintConfig) {
        appMigrations.defaultTemplate.config = answers.eslintConfig
      }
    }
  })
}
