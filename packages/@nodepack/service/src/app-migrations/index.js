/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  api.register({
    id: 'default-template@0.0.1',
    title: 'Template: Render default template',
    migrate: (api, options) => {
      api.render('./templates-0.0.1/default')

      // Add scripts
      api.extendPackage({
        scripts: {
          'dev': 'nodepack-service dev',
          'build': 'nodepack-service build',
          'start': 'node ./dist/app.js',
        },
      })
    },
    rollback: (api, options) => {
      api.unrender('./templates-0.0.1/default')

      // Remove scripts
      api.modifyFile('package.json', content => {
        // @ts-ignore
        const data = JSON.parse(content)
        const scripts = data.scripts
        if (scripts) {
          for (const key in scripts) {
            if (scripts[key].match(/nodepack-service (dev|build)/)) {
              scripts[key] = undefined
            }
          }
        }
        return JSON.stringify(data, null, 2)
      })
    },
  })
}
