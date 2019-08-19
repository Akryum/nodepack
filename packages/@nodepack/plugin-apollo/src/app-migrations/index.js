/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  const schemaTemplate = `./templates/schema-${api.hasPlugin('typescript') ? 'ts' : 'js'}`

  api.register({
    id: 'defaultPackage',
    title: 'Install dependencies',
    up: (api, options) => {
      api.extendPackage({
        dependencies: {
          graphql: '^14.4.2',
          'graphql-tag': '^2.10.1',
        },
      })
    },
    down: (api, options) => {
      api.extendPackage({
        dependencies: {
          graphql: undefined,
          'graphql-tag': undefined,
        },
      })
    },
  })

  api.register({
    id: 'defaultSchema',
    title: 'Template: default schema',
    up: (api, options) => {
      api.render(schemaTemplate, options)
    },
    down: (api, options) => {
      api.unrender(schemaTemplate)
    },
  })
}
