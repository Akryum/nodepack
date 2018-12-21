<p align="center">
  <img src="./nodepack.svg" width="200" height="200">
</p>

# nodepack

A modern node app development platform

**Warning: work in progress**

Nodepack is a modern, integrated and smart development environement for node backend developers. The bundling is done with Webpack.

<p align="center">
  <a href="https://www.patreon.com/akryum" target="_blank">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patreon">
  </a>
</p>

## Sponsors

### Silver

<p align="center">
  <a href="https://vueschool.io/" target="_blank">
    <img src="https://vueschool.io/img/logo/vueschool_logo_multicolor.svg" alt="VueSchool logo" width="200px">
  </a>
</p>

## About

The Goal is to provide a modern building base for JS backends.

**Features:**

- zero-config by default
- powerful plugin system
- live-reload in development
- single-file build (useful for function/lambda deployements)
- error diagnostics with suggested fix
- import/export in .js files
- app/code migrations
- environment migrations (soon)
- middlewares/runtime (soon)
- more to come!

**Builtin Integrations:**

- babel (to support old versions of node and/or new JS syntax)
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
yarn global add @nodepack/cli
```

Create a new project:

```
nodepack create my-app
```

## Usage in an existing project

Then add these to your `package.json` scripts:

```json
{
  "dev": "nodepack-service dev",
  "build": "nodepack-service build"
}
```

Configure it with a `nodepack.config.js` file in the root folder of your app:

```js
/** @typedef {import('@nodepack/service').ProjectOptions} ProjectOptions */

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
yarn add -D @nodepack/plugin-babel
```

Babel now transpiles your code!

## Prior Art

[@vue/cli](https://github.com/vuejs/vue-cli)
