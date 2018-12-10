# babel-preset-backpack

This package includes the [Babel](https://babeljs.io) preset used by [nodepack](https://github.com/moonreach/nodepack)

## Usage in Nodepack Projects

The easiest way to use this configuration is with Nodepack, which includes it by default. **You don’t need to install it separately in Nodepack projects.**

## Usage Outside of Nodepack

If you want to use this Babel preset in a project not built with Nodepack, you can install it with following steps.

First, [install Babel](https://babeljs.io/docs/setup/).

Then create a file named `.babelrc` with following contents in the root folder of your project:

```js
{
  "presets": ["@nodepack/service"]
}
```

This preset uses the `useBuiltIns` option with [transform-object-rest-spread](http://babeljs.io/docs/plugins/transform-object-rest-spread/), which assumes that `Object.assign` is available or polyfilled.
