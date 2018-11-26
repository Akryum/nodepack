<p align="center">
  <img src="./nodepack.svg" width="200" height="200">
</p>

# nodepack

A modern node app development platform

**Warning: work in progress**

Nodepack is a modern, integrated and smart development environement for node backend developers. The bundling is done with Webpack.

**Features:**

- zero-config by default
- powerful plugin system
- live-reload in development
- single-file build (useful for function/lambda deployements)
- error diagnostics with suggested fix
- import/export in .js files
- middlewares/runtime (soon)
- more to come!

**Builtin Integrations:**

- babel (to support old versions of node)
- typescript (soon)
- eslint (soon)
- jest (soon)
- apollo (soon)
- express (soon)
- koa (soon)
- hapi (soon)
- more to come!

## Getting started

Install the CLI:

```
yarn global add @moonreach/nodepack-cli
```

Create a new project:

```
nodepack create my-app
```

## Usage in an existing project

Then add these to your `package.json` scripts:

```json
{
  "dev": "nodepack dev",
  "build": "nodepack build"
}
```

Configure it with a `nodepack.config.js` file in the root folder of your app:

```js
/** @typedef {import('@moonreach/nodepack').ProjectOptions} ProjectOptions */

/** @type {ProjectOptions} */
module.exports = {
  // If you use VS Code, options will be autocompleted here
}
```

## Plugins

*For now, plugins must be manually installed. `nodepack add <plugin>` is planned!*

### Babel

Install the plugin into your project:

```
yarn add -D @moonreach/nodepack-plugin-babel
```

Babel now transpiles your code!

## Prior Art

[@vue/cli](https://github.com/vuejs/vue-cli)
