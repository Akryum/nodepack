/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  api.injectFeature({
    name: 'Passport (User authentication)',
    value: 'passport',
    // @ts-ignore
    description: 'Integrate passport to handle user login',
    link: 'http://www.passportjs.org',
  })

  api.onPromptComplete((answers, preset) => {
    if (answers.features.includes('passport')) {
      // @ts-ignore
      preset.plugins['@nodepack/plugin-passport'] = ''
    }
  })
}
