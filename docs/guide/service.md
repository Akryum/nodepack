# Working with Nodepack Service

A Nodepack project contains the `@nodepack/service` package which is responsible for compiling the project and other development-related tasks. Among others, it includes Webpack and sensible default configurations.

## Commands

The service expose commands registered by plugins. By default, it also have a few commands like `dev` (for development), `build` (for production) and `inspect` (to output the Webpack configuration).

The commands can be run as scripts in your `package.json` file:

```json
{
  "scripts": {
    "dev": "nodepack-service dev",
    "build": "nodepack-service build"
  }
}
```

You can also run them with `nodepack service <command>`:

```bash
nodepack service build
```

By default, a [maintenance](./maintenance.md) will be executed before the command. You can skip this by setting the `NODEPACK_NO_MAINTENANCE` env variable to `true`.

## Development build

To run the project in development mode use `nodepack` without argument:

```bash
nodepack
```

Your project is now compiled and run with hot-reloading, error diagnosis, auto-port, etc.

This shortcut will automatically execute either `npm run dev`, `yarn run dev` or `nodepack-service dev`.

The `dev` service command has the following usage:

```
Usage: nodepack-service dev [entry]

Options:

  -p, --port [port] Specify a default port for process.env.PORT (it may automatically change if not available)
  --dbg [port]      Run the app in remote debugging mode, so a Node inspector can be attached
  --git [message]   Force git commit with message before maintenance
  --no-git          Skip git commit before maintenance
  --no-preInstall   Skip dependencies install run at the begining
  --env <env>       specify env mode
```

### Automatic Port

If no `PORT` env variable is defined when running the development build with the `dev` service command, Nodepack will automatically find an available port for you.

You will see this message in the terminal:

```bash
INFO  `process.env.PORT` has been set to 4000
```

In you app, you can use it like this:

```js
server.listen(process.env.PORT || 4000)
```

### Error diagnostics

Nodepack service is able to handle some problems encountered by the compilation of your project (in development mode).

For example, is a package is missing, it can auto-install them for you:

```
 ERROR  Failed to compile with 1 errors

This dependency was not found:

* foobar in ./src/index.js

To install it, you can run: npm install --save foobar
 ERROR  Build failed with errors.
 INFO  Error diagnostic: Module foobar not found
? Suggested fix: Install foobar? (Use arrow keys)
❯ ✔ Apply this time
  ❌ Don't apply this time
  ✔ Apply this time and all the next times
  ❌ Don't apply this time and all the next times
```

Any plugin can add more error diagnostics to help you fix compilation errors!

::: tip
If you permatently apply or skip a suggested fix, you can reset this by changing the `suggestions` object in the `<your home>/.nodepackrc` file.
:::

### Debugging

To run your app in debug mode, use the `dbg` argument with a debugging port:

```bash
nodepack-service dev --dbg=1234
```

You can then use a [Node.js inspector client](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients) to remotly debug your code.

:::tip
If you are using Visual Studio Code, you can just enable Auto Attach for your current project with the `Debug: Toggle Auto Attach` command and then run the app with the `dbg` argument. VS Code will automatically start a debugging session!
:::

## Production build

To compile your project in production mode, use this command:

```bash
nodepack build
```

This shortcut will automatically execute either `npm run build`, `yarn run build` or `nodepack-service build`.

The `build` service command has the following usage:

```
Usage: nodepack-service build [entry]

Options:

  --no-clean      do not delete the dist folder before building
  --minify        minify the built files
  --git [message] Force git commit with message before maintenance
  --no-git        Skip git commit before maintenance
  --no-preInstall Skip dependencies install run at the begining
  --env <env>     specify env mode
```

### Built files optimization

By default, `build` will bundle all the dependencies (except for `@nodepack/module`).

This is benificial since the built files will only contain the used dependencies and the code will be smaller. It results in faster downloads from npm and makes your app also compatible with any serverless platform.

You can also enable minimization if its compatible with all your dependencies:

```bash
nodepack build --minify
```

## Inspect Webpack configuration

You can see the final Webpack configuration used to compile your project with this command:

```bash
nodepack service inspect
```

The `inspect` service command has the following usage:

```
Usage: nodepack-service inspect [entry] [options] [...paths]

Options:

  --mode                specify env mode (default: development)
  --rule <ruleName>     inspect a specific module rule
  --plugin <pluginName> inspect a specific plugin
  --rules               list all module rule names
  --plugins             list all plugin names
  --verbose             show full function definitions in output
  --env <env>           specify env mode
```
