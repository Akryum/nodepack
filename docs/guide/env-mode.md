# Environments & Variables

Environement variables allow you to define values to be used by build tools or your code specific to your environment or needs. This is very useful for example to change the server endpoints or the API keys of external services used in different environments.

In a typical backend project, you will want different environments like `development`, `test`, `staging` and `production`. For a library or a tool, `development`, `test` and `production` (for publishing to Npm) would suffice.

## Environment files

You can specify env variables by placing the following optional files in your project root:

``` bash
.env                       # always loaded
.env.local                 # always loaded, ignored by git
.env.[environment]         # only loaded in specified environment
.env.[environment].local   # only loaded in specified environment, ignored by git
```

You can set environment variables only available to a certain env by postfixing the `.env` file. For example, if you create a file named `.env.development` in your project root, then the variables declared in that file will only be loaded in development environment.

An `.env` file simply contains `key=value` pairs of environment variables:

```
KEY=value
NODE_APP_SECRET=api-key-xxx
```

::: warning Warning about NODE_ENV
If you have a default `NODE_ENV` in your environment, you should either remove it or explicitly set `NODE_ENV` when running [service](./service.md) commands.
:::

Loaded variables will become available to all [service](./service.md) commands, plugins and dependencies.

### Loading Priorities

An env file for a specific env (e.g. `.env.production`) will take higher priority than a generic one (e.g. `.env`).

For example, in the `production` environment Nodepack service will try to load in this order if they exist:

1. `.env.production.local`
2. `.env.production`
3. `.env.local`
4. `.env`

## Environments

An Environment is a specific state your define for your project. It will change which environment variables are set (with notably `NODE_ENV` which is used accross the wider node.js ecosystem).

By default, there are two envs in a Vue CLI project:

- `development` is used by `nodepack-service dev`
- `production` is used by `nodepack-service build`

:::tip
Each environment automatically set `NODE_ENV` to the same value by default. For example, `NODE_ENV` will be set to `"development"` in development environment.
:::

You can overwrite the default environment used for a [service](./service.md) command by passing the `--env` flag. For example, if you want to use development variables in the build command, add this to your `package.json` scripts:

```
"dev-build": "nodepack-service build --env development",
```

## Example: Staging Mode

Assuming we have a project with the following `.env` file:

```
DATABASE=my-app-pgsql
```

And the following `.env.staging` file:

```
NODE_ENV=production
DATABASE=my-app-pgsql-staging
```

- `nodepack-service build` will load `.env`, `.env.production` and `.env.production.local` if they exist;

- `nodepack-service build --env staging` will load `.env`, `.env.staging` and `.env.staging.local` if they exist.

In both cases, the project is built as a production app because of the value of `NODE_ENV`. However in the staging version, `process.env.DATABASE` is overwritten with a different value than in the production environment.

## Hard-coded values

The env variables that start with `NODE_APP_` will be statically written with `webpack.DefinePlugin`. This is useful if you want to distribute your built files on npm or easily deploy your app without worrying about your hosting platform settings.

For example, in your project source code:

``` js
console.log(process.env.NODE_APP_SECRET)
```

During build, `process.env.NODE_APP_SECRET` will be replaced by the corresponding value. In the case of `NODE_APP_SECRET=secret`, it will be replaced by `"secret"` as a string.

::: tip
You can have computed env vars in your `nodepack.config.js` file. This is useful for version info for example:

```js
process.env.NODE_APP_VERSION = require('./package.json').version

module.exports = {
  // Nodepack project config here
}
```
:::

The current env mode will be also hard coded with the `process.env.NODEPACK_ENV` value:

```js
if (process.env.NODEPACK_ENV === 'staging') {
  console.log(`I'm on staging!`)
}
```

## Local Only Variables

Sometimes you might have env variables that should not be committed into your version control, especially if your project is hosted in a public repository. You should then use an `.env.local` file instead. Local env files are ignored in `.gitignore` by default.

`.local` can also be appended to environment-specific env files, for example `.env.development.local` will be loaded during development, and will also ignored by git.
