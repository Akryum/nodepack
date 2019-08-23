# Database

To make managing and accessing a Database a breeze, Nodepack Database plugins can handle the heavy work for you. They will create the connections, handle [Database migrations](./db-migrations.md) and more!

## Knex

Currently, there is only one official Nodepack Database plugin available, which depends on [Knex](https://knexjs.org). This is a query builder that's making writing SQL queries easy and that supports a whole range of databases like Postgres, SQLite3 or MySQL.

You can add it to your project if you don't have it already:

```
nodepack add db-knex
```

### Configuration

Create a `config/db.js` or a `config/db.ts` file in your Nodepack project.

Example:

```js
// Knex configuration object
// See https://knexjs.org/#Installation-client

export default {
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test',
  },
}
```

In Typescript:

```ts
import { Config } from 'knex'

// Knex configuration object
// See https://knexjs.org/#Installation-client

export default {
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test',
  },
} as Config
```

### Usage in app

In the Context, you have access to the `knex` object:

```ts
import { bootstrap, printReady } from '@nodepack/app'

/** @typedef {import('@nodepack/plugin-db-knex').KnexContext} KnexContext */

/**
 * @param {KnexContext} ctx
 */
bootstrap(async (ctx) => {
  printReady()

  // Example SQL query using knex
  console.log(await ctx.knex.table('nodepack_migration_records')
    .first())
})
```

Or in Typescript:

```ts
import { bootstrap, printReady } from '@nodepack/app'
import { KnexContext } from '@nodepack/plugin-db-knex'

bootstrap(async (ctx: KnexContext) => {
  printReady()

  // Example SQL query using knex
  console.log(await ctx.knex.table('nodepack_migration_records')
    .first())
})
```

### Database Migrations

Create your [Database migrations](./db-migrations.md) in the `migration/db` folder in your Nodepack project.

Example migration:

```js
// migration/db/201908230224-users.js

/** @typedef {import('@nodepack/plugin-db-knex').KnexContext} KnexContext */

/**
 * @param {KnexContext} ctx
 */
exports.up = async (ctx) => {
  await ctx.knex.schema.createTable('app_users', builder => {
    builder.uuid('id').primary()
    builder.string('username').unique().notNullable()
    builder.string('email').unique().notNullable()
    builder.string('password').notNullable()
    builder.timestamp('created')
    builder.timestamp('last_login')
  })
}

/**
 * @param {KnexContext} ctx
 */
exports.down = async (ctx) => {
  await ctx.knex.schema.dropTable('app_users')
}
```
