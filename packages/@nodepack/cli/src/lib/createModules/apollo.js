/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  api.injectFeature({
    name: 'Apollo (needs Express)',
    value: 'apollo',
    // @ts-ignore
    description: 'GraphQL Server',
    link: 'https://www.apollographql.com/',
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('apollo')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-apollo'] = ''
    }
  })
}
