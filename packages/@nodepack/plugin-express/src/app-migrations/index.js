/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  const routesTemplate = `./templates/routes-${api.hasPlugin('typescript') ? 'ts' : 'js'}`

  api.register({
    id: 'defaultRoutes',
    title: 'Template: default routes',
    up: (api, options) => {
      api.render(routesTemplate, options)
    },
    down: (api, options) => {
      api.unrender(routesTemplate)
    },
  })
}
