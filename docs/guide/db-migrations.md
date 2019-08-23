# Database migrations

Those migrations are very similar to the [env migrations](./env-migrations.md). The difference is that the data about the migrations are stored in each target databases.

## Create migrations

To set up some database migrations in your project, create a `migration/db` folder at the root of the project. Then you can create any number of JS files in this folder that exports an `up` function:

```js
// migration/db/201908230224-users.js

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

See an [example migration with Knex](./database.md#knex-database-migrations).

## Rollbacks

*Available soon...*
