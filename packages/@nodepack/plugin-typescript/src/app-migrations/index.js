/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  api.register({
    id: 'defaultTemplate',
    title: 'Template: Render default template',
    // when: api => api.fromVersion('<0.0.1') || api.isFirstInstall,
    prompts: () => [
      {
        name: 'tslint',
        message: 'Use TSLint',
        type: 'confirm',
      },
    ],
    up: (api, options) => {
      api.render('./templates/default', options)
      api.move('src/**/*.js', file => `${file.path}${file.name}.ts`)

      if (options.tslint) {
        api.extendPackage({
          scripts: {
            'lint': 'nodepack-service lint',
          },
        })
      }
    },
    down: (api, options) => {
      api.unrender('./templates/default')
      api.move('src/**/*.ts', file => `${file.path}${file.name}.js`)

      if (options.tslint) {
        api.extendPackage(({ scripts }) => {
          if (scripts) {
            scripts = { ...scripts }
            for (const key in scripts) {
              if (scripts[key].match(/nodepack-service lint/)) {
                delete scripts[key]
              }
            }
          }
          return { scripts }
        }, false)
      }
    },
  })

  // api.register({
  //   id: 'tsconfig-test-libs@0.0.1',
  //   title: 'tsconfig: Added test libs',
  //   up: (api, options) => {
  //     // TODO
  //   },
  //   down: (api, options) => {
  //     // TODO
  //   },
  // })
}
