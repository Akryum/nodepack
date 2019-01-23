# App Migrations

Any [plugin](./plugins.md) and the Nodepack [service](./service.md) can register one or more app migrations. An app migration should have both a `migrate` code and a `rollback` code. Those codes can modify project source code by adding, editing or deleting files, as well as installing new dependencies in your project `package.json`. By default the [maintenances](./maintenance.md) applying or rollbacking app migrations will commit your app code state with Git commit so that your work won't be accidentally altered or removed.

For example, adding the official Typescript plugin with `nodepack add typescript` in the project will execute an app migration that will:

- generate the `tsconfig.json` and `tslint.json` files in the root folder
- rename `.js` files in the source folder to `.ts` files
- add the `lint` script in the `package.json` file for running TSLint

Each migration has an id and is only applied once on a project, unless it's rollbacked. Records of applied app migrations are kept in the `.nodepack` folder at the root of the project directory.

::: warning
You should make sure that the `.nodepack` folder is commited into version control, or else other contributors may apply app migrations multiple times.
:::

Prompts may be displayed to further customize the modification made to the project.

Here is an example of app migration happening while adding the official Typescript plugin:

```
nodepack add typescript
🚀  Migrating app code...
@nodepack/plugin-typescript is prompting:
? Use TSLint Yes
✔️  @nodepack/plugin-typescript Template: Render default template
📝  1 app migration applied!
🔧  Maintenance complete!
🎉  Successfully added @nodepack/plugin-typescript.
```

Note how at some point the app migration requested input from the user to ask if he wants to use TSLint.
