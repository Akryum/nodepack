/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  const configTemplate = `./templates/config-${api.hasPlugin('typescript') ? 'ts' : 'js'}`

  api.register({
    id: 'defaultConfig',
    title: 'Template: default config',
    up: (api, options) => {
      api.render(configTemplate, options)
    },
    down: (api, options) => {
      api.unrender(configTemplate)
    },
  })
}
