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
}
