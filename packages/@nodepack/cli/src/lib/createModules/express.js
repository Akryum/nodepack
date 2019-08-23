/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  api.injectFeature({
    name: 'Express (HTTP server)',
    value: 'express',
    // @ts-ignore
    description: 'HTTP server compatible with Connect middlewares',
    link: 'http://expressjs.com/',
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('express')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-express'] = ''
    }
  })
}
