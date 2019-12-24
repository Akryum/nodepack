const DB_PLUGINS = [
  {
    value: '@nodepack/plugin-db-knex',
    name: 'Knex (Query Builder)',
  },
  {
    value: '@nodepack/plugin-db-sequelize',
    name: 'Sequelize (ORM)',
  },
  {
    value: '@nodepack/plugin-db-fauna',
    name: 'FaunaDB',
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
    if (answers.features.includes('db')) {
      // @ts-ignore
      preset.plugins[answers.dbPlugin] = ''
    }
  })
}
