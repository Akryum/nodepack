import { ServicePluginAPI, MigratorOperationAPI } from '@nodepack/service'
import { Linter } from 'eslint'

const baseExtensions = ['.js', '.jsx']
export const getExtensions = (api: ServicePluginAPI) => api.hasPlugin('typescript')
  ? baseExtensions.concat('.ts', '.tsx')
  : baseExtensions

// __expression is a special flag that allows us to customize stringification
// output when extracting configs into standalone files
function makeJSOnlyValue (str: string) {
  const fn = () => {}
  fn.__expression = str
  return fn
}

export function createDefaultConfig (api: MigratorOperationAPI) {
  const config: Linter.Config = {
    root: true,
    env: { node: true },
    extends: [],
    plugins: [],
    settings: {},
    rules: {
      // @ts-ignore
      'no-console': makeJSOnlyValue(`process.env.NODE_ENV === 'production' ? 'error' : 'off'`),
      // @ts-ignore
      'no-debugger': makeJSOnlyValue(`process.env.NODE_ENV === 'production' ? 'error' : 'off'`),
    },
  }
  if (api.hasPlugin('typescript')) {
    config.parser = '@typescript-eslint/parser'
    config.parserOptions = {
      sourceType: 'module',
    }
    if (Array.isArray(config.extends)) {
      config.extends.push('plugin:@typescript-eslint/eslint-recommended')
    }
    config.plugins.push('@typescript-eslint')
    Object.assign(config.rules, {
      // https://typescript-eslint.io/parser
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // temporary fix for https://github.com/vuejs/vue-cli/issues/1922
      // very strange as somehow this rule gets different behaviors depending
      // on the presence of @typescript-eslint/parser...
      'strict': 'off',
    })
  }
  return config
}
