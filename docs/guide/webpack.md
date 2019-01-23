# Working with Webpack

Webpack is used under-the-hood by Nodepack to compile your project.

## Customizing the Webpack configuration

The internal Webpack config is generated using [webpack-chain](https://github.com/mozilla-neutrino/webpack-chain). The library provides an abstraction over the raw webpack config, with the ability to define named loader rules and named plugins, and later "tap" into those rules and modify their options.

This allows plugins to precisely customize the configuration without altering the rest. You can also do this in your project directly. Below you will see some examples of common modifications done via the [chainWebpack](../config/#chainwebpack) option in `nodepack.config.js`.

:::tip
You can use [nodepack-service inspect](./service.md#inspect-webpack-configuration) to get information about the names of the rules and plugins. This is very useful to get started using webpack-chain!
:::

### Modifying Options of a Loader

```js
// nodepack.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('ts')
      .use('ts-loader')
        .loader('ts-loader')
        .tap(options => {
          // modify the options...
          return options
        })
  }
}
```

### Adding a New Loader

```js
// nodepack.config.js
module.exports = {
  chainWebpack: config => {
    // GraphQL Loader
    config.module
      .rule('graphql')
      .test(/\.graphql$/)
      .use('graphql-tag/loader')
        .loader('graphql-tag/loader')
        .end()
  }
}
```

### Replacing Loaders of a Rule

```js
// nodepack.config.js
module.exports = {
  chainWebpack: config => {
    const tsRule = config.module.rule('svg')

    // clear all existing loaders.
    // if you don't do this, the loader below will be appended to
    // existing loaders of the rule.
    tsRule.uses.clear()

    // add replacement loader(s)
    tsRule
      .use('my-ts-loader')
        .loader('my-ts-loader')
        .options({ ... })
  }
}
```

### Modifying Options of a webpack plugin

```js
// nodepack.config.js
module.exports = {
  chainWebpack: config => {
    config
      .plugin('friendly-errors')
      .tap(args => {
        args[0].clearConsole = true
        // new args to pass to friendly-errors's constructor
        return args
      })
  }
}
```

### Adding a new webpack plugin

When you add a new plugin, don't call the constructor directly with `new`, just pass the class:

```js
const SomeWebpackPlugin = require('some-webpack-plugin')

// nodepack.config.js
module.exports = {
  chainWebpack: config => {
    config
      .plugin('some-plugin')
      .use(SomeWebpackPlugin, [
        /* Constructor args here */
        'arg1',
        'arg2'
      ])
  }
}
```

<br>

*This section of the guide is Work in progress...*
