const DB_PLUGINS = [
  {
    value: '@nodepack/plugin-db-knex',
    name: 'Knex (Query Builder)',
  },
  {
    value: '@nodepack/plugin-db-sequelize',
    name: 'Sequelize (ORM)',
  },
]

/** @type {import('../ProjectCreateJob').CreateModule} */
module.exports = api => {
  const featureName = 'Database'

  api.injectFeature({
    name: featureName,
    value: 'db',
    // @ts-ignore
    description: 'Connect to a Database',
  })

  api.injectPrompt({
    name: 'dbPlugin',
    when: answers => answers.features.includes('db'),
    type: 'list',
    message: 'Database plugin to use',
    choices: DB_PLUGINS,
    // @ts-ignore
    group: featureName,
  })

  api.onPromptComplete((answers, preset) => {
    // @ts-ignore
    preset.plugins[answers.dbPlugin] = ''
  })
}
