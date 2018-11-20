<p align="center">
  <img src="./nodepack.svg" width="200" height="200">
</p>

# nodepack

**Warning: work in progress**

## Getting started

```
yarn add -D @moonreach/nodepack
```

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
