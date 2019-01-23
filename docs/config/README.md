# Configuration Reference

Nodepack is configured through the `nodepack.config.js` file in the root directory of your project. It should export an object with the available options:

```js
module.exports = {
  // Configure your project here
}
```

## Typings

If you use a typescript-enabled IDE (like Visual Studio Code), you can get type autocompletion with this JSDoc comment:

```js
/** @type {import('@nodepack/service').ProjectOptions} */
module.exports = {
  // Typings will be available here!
}
```
