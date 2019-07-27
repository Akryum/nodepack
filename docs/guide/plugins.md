# Plugins

> At the core of any Nodepack project, plugins allow you to build your applications.

Nodepack plugins are packages using the Nodepack APIs. They provide features and tools integrated with each other that you can easily plug into your project.

Each plugin has different parts:

- A [service](./service.md) plugin which is executed when `@nodepack/service` is run (for example, with the `nodepack-service` command).
- [App migrations](./app-migrations.md) that can install dependencies and modify your project code when the plugin is installed, upgraded or removed.
- [Environment migrations](./env-migrations.md)

For example, when you install the official Typescript plugin, it can:

- Generate `tsconfig.json` in your project
- Rename your files to `.ts`
- Setup TSLint

Then, when you run `nodepack` or `nodepack-service dev`, it will automatically:

- Compile `.ts` files
- Check for typing errors

::: tip
The [Nodepack Service](./service.md) is a special plugin installed in any Nodepack project.
:::

## Plugin name

To be a valid Nodepack plugin, the package needs its name to be either:

- `nodepack-plugin-<name>` for normal packages
- `@<scope>/nodepack-plugin-<name>` for scoped packages
- `@nodepack/plugin-<name>` for official plugins

## Adding a plugin

In your Nodepack project, you can add one plugin at a time with this command:

```bash
nodepack add <plugin>
```

In some case, the plugin name will be automatically expanded. For example, those are equivalent:

```bash
nodepack add awesome
# is equivalent to
nodepack add nodepack-plugin-awesome
```

It also works with scopes:

```bash
nodepack add @scope/awesome
# is equivalent to
nodepack add @scope/nodepack-plugin-awesome
```

Official plugin names will be expanded too:

```bash
nodepack add typescript
# is equivalent to
nodepack add @nodepack/plugin-typescript
```

Adding a plugin may modify your project files. By default, a Git commit will save the state of your app before and after adding the plugin.

## Upgrading plugins

You can upgrade one or more plugins which this command:

```bash
nodepack upgrade
```

Nodepack will then check for plugin updates and propose you different upgrade options.

Upgrading a plugin may modify your project files. By default, a Git commit will save the state of your app before and after the upgrade process.

## Removing a plugin

To remove a plugin, use the following command:

```bash
nodepack remove typescript
```

The same automatic name rules as `nodepack add` applies.

Removing a plugin may modify your project files. By default, a Git commit will save the state of your app before and after removing the plugin.
