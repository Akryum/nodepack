/** @type {import('../ProjectCreator').CreateModule} */
module.exports = api => {
  api.injectFeature({
    name: 'Typescript',
    value: 'ts',
  })

  api.injectPrompt({
    name: 'useTsWithBabel',
    when: answers => answers.features.includes('ts'),
    type: 'confirm',
    message: 'Use Babel alongside TypeScript for auto-detected polyfills?',
    default: answers => answers.features.includes('babel'),
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('ts')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-typescript'] = ''
    }
  })
}
