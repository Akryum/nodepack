import { MigratorAPI } from '@nodepack/service'
import { createDefaultConfig } from '../options'

export default (api: MigratorAPI) => {
  // Configs with templates
  const templates = ['airbnb', 'standard']

  // For uninstallation
  const possibleDevDependencies = [
    'eslint',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint-config-airbnb-base',
    'eslint-import-resolver-webpack',
    'eslint-plugin-import',
    'eslint-config-standard',
    'eslint-plugin-import',
    'eslint-plugin-node',
    'eslint-plugin-promise',
    'eslint-plugin-standard',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'prettier',
  ]

  api.register({
    id: 'defaultConfig',
    title: 'Template: default config',
    prompts: () => [
      {
        name: 'config',
        type: 'list',
        message: `Pick an ESLint config:`,
        choices: [
          {
            name: 'Error prevention only',
            value: 'base',
            short: 'Basic',
          },
          {
            name: 'Airbnb',
            value: 'airbnb',
            short: 'Airbnb',
          },
          {
            name: 'Standard',
            value: 'standard',
            short: 'Standard',
          },
          {
            name: 'Prettier',
            value: 'prettier',
            short: 'Prettier',
          },
        ],
      },
    ],
    up: (api, options) => {
      api.render(`templates/default`, options)
      const { config } = options
      if (templates.includes(config)) {
        api.render(`templates/${config}`, options)
      }

      const eslintConfig = createDefaultConfig(api)

      const pkg = {
        scripts: {
          lint: 'nodepack-service lint',
        },
        eslintConfig,
        devDependencies: {
          eslint: '^6.5.1',
        },
      }

      if (api.hasPlugin('typescript')) {
        Object.assign(pkg.devDependencies, {
          '@typescript-eslint/eslint-plugin': '^2.5.0',
          '@typescript-eslint/parser': '^2.5.0',
        })
      }

      const presets: string[] = Array.isArray(eslintConfig.extends) ? eslintConfig.extends : [eslintConfig.extends]
      if (config === 'airbnb') {
        presets.unshift('eslint-config-airbnb-base')
        Object.assign(pkg.devDependencies, {
          'eslint-config-airbnb-base': '^13.1.0',
          'eslint-import-resolver-webpack': '^0.11.1',
          'eslint-plugin-import': '^2.17.3',
        })
        Object.assign(eslintConfig.settings, {
          'import/resolver': {
            webpack: {
              config: '@nodepack/service/webpack.config.js',
            },
          },
          'import/extensions': [
            '.js',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
          ],
        })
        Object.assign(eslintConfig.rules, {
          'import/extensions': ['error', 'always', {
            js: 'never',
            mjs: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
          }],
          'no-param-reassign': ['error', {
            props: true,
            ignorePropertyModificationsFor: [
              'state', // for vuex state
              'acc', // for reduce accumulators
              'e', // for e.returnvalue
            ],
          }],
        })
      } else if (config === 'standard') {
        presets.unshift('eslint-config-standard')
        Object.assign(pkg.devDependencies, {
          'eslint-config-standard': '^12.0.0',
          'eslint-plugin-import': '^2.17.3',
          'eslint-plugin-node': '^9.1.0',
          'eslint-plugin-promise': '^4.1.1',
          'eslint-plugin-standard': '^4.0.0',
        })
      } else if (config === 'prettier') {
        presets.unshift('eslint:recommended', 'eslint-config-prettier')
        Object.assign(pkg.devDependencies, {
          'eslint-config-prettier': '^6.0.0',
          'eslint-plugin-prettier': '^3.1.0',
          'prettier': '>= 1.13.0',
        })
        eslintConfig.plugins.push('prettier')
        Object.assign(eslintConfig.rules, {
          'prettier/prettier': 'warn',
        })
      } else {
        presets.unshift('eslint:recommended')
      }
      eslintConfig.extends = presets

      // @TODO lint on commit

      api.extendPackage(pkg)
    },
    down: (api, options) => {
      api.unrender(`templates/default`)
      const { config } = options
      if (templates.includes(config)) {
        api.unrender(`templates/${config}`)
      }

      api.extendPackage(({ scripts, devDependencies }) => {
        if (scripts) {
          scripts = { ...scripts }
          for (const key in scripts) {
            if (scripts[key].match(/nodepack-service lint/)) {
              delete scripts[key]
            }
          }
        }
        if (devDependencies) {
          devDependencies = { ...devDependencies }
          for (const key in devDependencies) {
            if (possibleDevDependencies.includes(key)) {
              delete devDependencies[key]
            }
          }
        }
        return { scripts, devDependencies, eslintConfig: null }
      }, false)
    },
  })
}
