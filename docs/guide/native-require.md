# Native require and dynamic modules

Since Nodepack uses Webpack to compile your code, by default all `require` calls will use Webpack own internal `require` implementation. Most of the time this is fine but in some use cases you want to use Node's native `require` implementation. For example, your app has a plugin system that should be able to load modules dynamically in the user project.

To use native require and other native Node modules utilities, install `@nodepack/module`:

```bash
yarn add @nodepack/module
```

Then you can access the native Node `require` API:

```js
import { nativeRequire } from '@nodepack/module'

nativeRequire('./some-module')
```

This package also comes with useful utilities to dynamically resolve or load modules.

## Resolve a module

```js
import { resolveModule } from '@nodepack/module'

const request = 'some-module/ui.js'
const cwd = '/home/user/some-project'

const modulePath = resolveModule(request, cwd)
```

Note that this will automatically use a fallback if you are using an old version of Node that doesn't support `require.resolve`.

## Load a module dynamically

```js
import { loadModule } from '@nodepack/module'

const request = 'some-module/ui.js'
const cwd = '/home/user/some-project'
const clearModuleCache = true

const moduleExports = loadModule(request, cwd, clearModuleCache)
```

## Clear a module from Node cache

```js
import { clearModule } from '@nodepack/module'

const request = 'some-module/ui.js'
const cwd = '/home/user/some-project'

clearModule(request, cwd)
```

## Other utilities

```js
import {
  mayBeNodeModule,
  isRelative,
  isAbsolute
} from '@nodepack/module'

// Checks if module could be a node_modules package
console.log(mayBeNodeModule('chalk'))

// Checks if module request is a relative module
console.log(isRelative('./some-js-module'))

// Checks if module request is an absolute module
console.log(isAbsolute('/home/user/some-project/src/some-js-module'))
```
