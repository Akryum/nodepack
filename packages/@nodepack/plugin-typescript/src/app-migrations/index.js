/** @type {import('@nodepack/service').MigrationPlugin} */
module.exports = api => {
  api.register({
    id: 'defaultTemplate',
    title: 'Template: Render default template',
    up: (api, options) => {
      api.render('./templates/default', options)
      api.move('src/**/*.js', file => `${file.path}${file.name}.ts`)
    },
    down: (api, options) => {
      api.unrender('./templates/default')
      api.move('src/**/*.ts', file => `${file.path}${file.name}.js`)
    },
  })

  api.register({
    id: 'configPath',
    title: 'Add `@config` alias to paths',
    up: (api, options) => {
      api.modifyFile('tsconfig.json', (content) => {
        if (typeof content === 'string') {
          const { removeTrailingComma } = require('@nodepack/utils')
          const { parse, stringify } = require('comment-json')
          const config = parse(removeTrailingComma(content))
          if (!config.compilerOptions) {
            config.compilerOptions = {}
          }
          if (!config.compilerOptions.baseUrl) {
            config.compilerOptions.baseUrl = '.'
          }
          if (!config.compilerOptions.paths) {
            config.compilerOptions.paths = {}
          }
          config.compilerOptions.paths['@config/*'] = [
            'config/*',
          ]
          return stringify(config, null, 2)
        }
        return content
      })
    },
    down: (api, options) => {
      api.modifyFile('tsconfig.json', (content) => {
        if (typeof content === 'string') {
          const { removeTrailingComma } = require('@nodepack/utils')
          const { parse, stringify } = require('comment-json')
          const config = parse(removeTrailingComma(content))
          if (config.compilerOptions && config.compilerOptions.paths) {
            delete config.compilerOptions.paths['@config/*']
            return stringify(config, null, 2)
          }
        }
        return content
      })
    },
  })

  api.register({
    id: 'contextTypePath',
    title: 'Add `@context` alias to paths',
    up: (api, options) => {
      api.modifyFile('tsconfig.json', (content) => {
        if (typeof content === 'string') {
          const { removeTrailingComma } = require('@nodepack/utils')
          const { parse, stringify } = require('comment-json')
          const config = parse(removeTrailingComma(content))
          if (!config.compilerOptions) {
            config.compilerOptions = {}
          }
          if (!config.compilerOptions.baseUrl) {
            config.compilerOptions.baseUrl = '.'
          }
          if (!config.compilerOptions.paths) {
            config.compilerOptions.paths = {}
          }
          config.compilerOptions.paths['@context'] = [
            'src/generated/context.d.ts',
          ]
          return stringify(config, null, 2)
        }
        return content
      })
    },
    down: (api, options) => {
      api.modifyFile('tsconfig.json', (content) => {
        if (typeof content === 'string') {
          const { removeTrailingComma } = require('@nodepack/utils')
          const { parse, stringify } = require('comment-json')
          const config = parse(removeTrailingComma(content))
          if (config.compilerOptions && config.compilerOptions.paths) {
            delete config.compilerOptions.paths['@context']
            return stringify(config, null, 2)
          }
        }
        return content
      })
    },
  })
}
