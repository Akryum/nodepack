# Context

The Context is an object typically created for every requests made to your server, or individual actions run in your app. Its purpose is to hold useful properties like the database driver you use or data about the currently logged in user.

You can use the context in both apps, Nodepack plugins or even external code.

## Create

To create a context, use `createContext` from the `@nodepack/app-context` package. Note that it will automatically call the `create` [hook](#hook).

```js
import { createContext } from '@nodepack/app-context'

async function main () {
  const context = createContext()
  console.log(context)
}
```

Creating a context will automatically load and put all your project [configuration](./config.md) in the `context.config` property.

## Hook

Use the `hook` method to hook into the context:

```js
import { hook } from '@nodepack/app-context'

hook('create', async (context) => {
  context.user = await loginUser(context)
})
```

## Call a hook

Use the `callHook` method to manually call a hook:

```js
import { callHook } from '@nodepack/app-context'

async function main () {
  // ...
  callHook('loggedIn', context)
}
```

All async hook callbacks will be automatically awaited sequentially by order of registration.

## Usage outside of app

You can directly load the `context` built fragment of the project:

```js
const { createContext, hook, callHook } = require('my-project/dist/context')
```
