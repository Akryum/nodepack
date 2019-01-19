# Creating a project

To create a new `my-app` project, use this command:

```bash
nodepack create my-app
```

You will be prompted to choose a [Preset](./preset.md) or to manually select features. If you go with the second route, you will prompted several option to customize the bootstraping of your project. When you will be done, you will be able to save your whole selection into a new Preset.

To run the project in development mode, move to its folder:

```bash
cd my-app
```

Then run `nodepack` without argument:

```bash
nodepack
```

Your project is now compiled and run with hot-reloading, error diagnosis, auto-port, etc.

::: tip
This will automatically execute either `npm run dev`, `yarn run dev` or `nodepack-service dev`.
:::
