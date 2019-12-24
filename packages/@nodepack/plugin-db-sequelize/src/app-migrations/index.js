/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  const exampleTemplate = `./templates/example-${api.hasPlugin('typescript') ? 'ts' : 'js'}`

  api.register({
    id: 'defaultExample',
    title: 'Template: default example',
    up: (api, options) => {
      api.render(exampleTemplate, options)
    },
    down: (api, options) => {
      api.unrender(exampleTemplate)
    },
  })

  api.register({
    id: 'configRename',
    title: 'Rename config file',
    when: api => api.fromVersion('<0.8.0'),
    up: (api, options) => {
      api.move('config/db.{js,ts}', file => `${file.path}sequelize.${file.ext}`)
    },
    down: (api, options) => {
      api.move('config/sequelize.{js,ts}', file => `${file.path}db.${file.ext}`)
    },
  })
}
