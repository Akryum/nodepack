/** @typedef {import('../lib/PackPlugin.js').PackPluginApply} PackPluginApply */

/** @type {PackPluginApply} */
module.exports = (api, options) => {
  api.registerCommand('inspect', {
    description: 'inspect internal webpack config',
    usage: 'nodepack inspect [options] [...paths]',
    options: {
      '--mode': 'specify env mode (default: development)',
      '--rule <ruleName>': 'inspect a specific module rule',
      '--plugin <pluginName>': 'inspect a specific plugin',
      '--rules': 'list all module rule names',
      '--plugins': 'list all plugin names',
      '--verbose': 'show full function definitions in output',
    },
  }, async args => {
    const { get } = require('@moonreach/nodepack-utils')
    const { toString } = require('webpack-chain')
    const config = await api.resolveWebpackConfig()
    const { _: paths, verbose } = args

    let res
    if (args.rule) {
      res = config.module.rules.find(r => r.__ruleNames[0] === args.rule)
    } else if (args.plugin) {
      res = config.plugins.find(p => p.__pluginName === args.plugin)
    } else if (args.rules) {
      res = config.module.rules.map(r => r.__ruleNames[0])
    } else if (args.plugins) {
      res = config.plugins.map(p => p.__pluginName || p.constructor.name)
    } else if (paths.length > 1) {
      res = {}
      paths.forEach(path => {
        res[path] = get(config, path)
      })
    } else if (paths.length === 1) {
      res = get(config, paths[0])
    } else {
      res = config
    }

    // @ts-ignore
    const output = toString(res, { verbose })
    console.log(output)
  })
}

// @ts-ignore
module.exports.defaultModes = {
  inspect: 'development',
}
