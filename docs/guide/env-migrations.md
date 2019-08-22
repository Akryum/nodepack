# Environment Migrations

This second type of migrations is meant for the user specific environment. A typical example would be the Database, which needs to be created, seeded and updated as the development of the project progresses.

The big difference with the [app migrations](./app-migrations.md) is that the results of the migrations shouldn't be put into version control (like Git) because it depends on each user environment. By default Nodepack will put `/.nodepack/env-migration-records.json` into `/.nodepack/.gitignore`.

A environment migration can execute any code, for example SQL queries to update a developer Database schema after another developer on the same project made changes to the app.

## Create migrations

To set up some env migrations in your project, create a `migration/env` folder at the root of the project. Then you can create any number of JS files in this folder that exports an `up` function:

```js
// migration/env/201907282100-create-user-table.js

// Migration
exports.up = async (context) => {
  // ...
}

// Rollback
exports.down = async (context) => {
  // ...
}
```

The migration functions gets the [context](./context.md) as argument.

The migrations will be executed depending on the file name in alphabetical order. Thus it is recommended to use a timestamp as the start of the file name. For example:

```
<year><month><date><hours><minutes>-my-migration.js
```

Migrations will be applied automatically during any [Maintenance](./maintenance.md).

## Rollbacks

*Available soon...*
