/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  const featureName = 'Typescript'

  api.injectFeature({
    name: featureName,
    value: 'ts',
    // @ts-ignore
    description: 'Add support for the TypeScript language',
    link: 'https://github.com/Akryum/nodepack/tree/dev/packages/%40nodepack/plugin-typescript',
  })

  api.injectPrompt({
    name: 'useTsWithBabel',
    when: answers => answers.features.includes('ts') && answers.features.includes('babel'),
    type: 'confirm',
    message: 'Use Babel alongside TypeScript for auto-detected polyfills?',
    // @ts-ignore
    description: 'It will output ES2015 and delegate the rest to Babel for auto polyfill based on compilation targets.',
    default: true,
    // @ts-ignore
    group: featureName,
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('ts')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-typescript'] = ''
    }

    const appMigrations = preset.appMigrations['@nodepack/plugin-typescript'] = {
      defaultTemplate: {},
    }
    if (answers.useTsLint) {
      appMigrations.defaultTemplate.tslint = true
    }
  })
}
