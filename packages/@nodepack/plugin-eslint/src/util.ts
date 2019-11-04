function camelize (str: string) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

const renamedArrayArgs = {
  ext: 'extensions',
  env: 'envs',
  global: 'globals',
  rulesdir: 'rulePaths',
  plugin: 'plugins',
  'ignore-pattern': 'ignorePattern',
}

const renamedArgs = {
  'inline-config': 'allowInlineConfig',
  rule: 'rules',
  eslintrc: 'useEslintrc',
  c: 'configFile',
  config: 'configFile',
}

export function normalizeConfig (args: any): any {
  const config = {}
  for (const key in args) {
    if (renamedArrayArgs[key]) {
      config[renamedArrayArgs[key]] = args[key].split(',')
    } else if (renamedArgs[key]) {
      config[renamedArgs[key]] = args[key]
    } else if (key !== '_') {
      config[camelize(key)] = args[key]
    }
  }
  return config
}
