import { MigratorAPI } from '@nodepack/service'

module.exports = (api: MigratorAPI) => {
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

  api.register({
    id: 'configRename',
    title: 'Rename config file',
    when: api => api.fromVersion('<0.8.0'),
    up: (api, options) => {
      api.move('config/db.{js,ts}', file => `${file.path}fauna.${file.ext}`)
    },
    down: (api, options) => {
      api.move('config/fauna.{js,ts}', file => `${file.path}db.${file.ext}`)
    },
  })
}
