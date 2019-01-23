# Configuration Reference

## Global Configuration

Some configuration is globally stored in a `.nodepackrc` JSON file in your home directory. It also contains saved presets and permanent options for error diagnostics.

You can edit this file with your favorite code editor and save it in place.

## nodepack.config.js

Nodepack is configured through the `nodepack.config.js` file in the root directory of your project. It should export an object with the available options:

```js
module.exports = {
  // Configure your project here
}
```

If you use a typescript-enabled IDE (like Visual Studio Code), you can get type autocompletion with this JSDoc comment:

```js
/** @type {import('@nodepack/service').ProjectOptions} */
module.exports = {
  // Typings will be available here!
}
```

### outputDir

- Type: `string`

- Default: `./dist`

The folder where the built files will be written when running `nodepack-service build`.

::: tip
Before each compilation, the folder will be removed. You can disable this behavior with `--no-clean`.
:::

### entry

- Type: `string`

- Default: `src/index.js`

Entry file (relative to project root).

### defaultPort

- Type: `number`

- Default: `4000`

Default port for `process.env.PORT` if it is not defined.

It will change to a free port automatically if it is not available. See [Automatic Port](../guide/service.md#automatic-port) for more details.

### minify

- Type: `boolean`

- Default: `false`

Enable minification of the built files in production mode.

### parallel

- Type: `boolean`

- Default: `true` if your computer has multiple cores

Enable parallel compilation over multiple cores.

### productionSourceMap

- Type: `boolean`

- Default: `false`

Enable Source Maps in production mode.

### externals

- Type: `boolean|Array.<string>|string`

- Default: `false`

Modules and packages marked as external are not bundled into the built files.

If `false`, nothing is marked as external (except for `@nodepack/module` which must be external to work properly).

In case you don't want the dependencies to be built into the final output, you should set this option to `true`, which will let Nodepack figureout which module should be external (for example modules in `node_modules` folder). You can further customize this with the [nodeExternalsWhitelist](#nodeexternalswhitelist) option.

If a string or an array of strings, only those specific modules will be external (plus `@nodepack/module`).

### nodeExternalsWhitelist

- Type: `Array.<string | RegExp>|function`

- Default: whitelists assets like `.css`, `.png`, `.svg`...

If [externals](#externals) is `true`, [webpack-node-externals](https://github.com/liady/webpack-node-externals) is used to determinate which module should be marked as external. See [whitelist option](https://github.com/liady/webpack-node-externals#optionswhitelist-) for more details.

### chainWebpack

- Type: `function`

Use [webpack-chain](https://github.com/mozilla-neutrino/webpack-chain) to customize the final Webpack configuration.

See [Working with Webpack](../guide/webpack.md) for more details.

### pluginOptions

- Type: `any`

Options for third-party plugins.
