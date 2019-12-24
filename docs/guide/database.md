# Database

To make managing and accessing a Database a breeze, Nodepack Database plugins can handle the heavy work for you. They will create the connections, handle [Database migrations](./db-migrations.md) and more!

## Knex

[Knex](https://knexjs.org) is a query builder that's making writing SQL queries easy and that supports a whole range of databases like Postgres, SQLite3 or MySQL.

You can add it to your project if you don't have it already:

```
nodepack add db-knex
```

### Knex Configuration

Create a `config/db.js` or a `config/db.ts` file in your Nodepack project.

Javascript Example:

```js
// config/db.js

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

Typescript Example:

```ts
// config/db.ts

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

### Knex Usage in app

In the [Context](./context.md), you have access to the `knex` object.

Javascript Example:

```js
// src/index.js

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

Typescript Example:

```ts
// src/index.ts

import { bootstrap, printReady } from '@nodepack/app'
import { KnexContext } from '@nodepack/plugin-db-knex'

bootstrap(async (ctx: KnexContext) => {
  printReady()

  // Example SQL query using knex
  console.log(await ctx.knex.table('nodepack_migration_records').first())
})
```

### Knex Database Migrations

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

## Sequelize

[Sequelize](https://sequelize.org/) is an ORM that supports a whole range of databases like Postgres, SQLite3 or MySQL.

You can add it to your project if you don't have it already:

```
nodepack add db-sequelize
```

### Sequelize Configuration

Create a `config/db.js` or a `config/db.ts` file in your Nodepack project.

Javascript Example:

```js
// config/db.js

// Sequelize options object
// See https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor

export default {
  dialect: 'mysql',
  host: '127.0.0.1',
  username: 'your_database_user',
  password: 'your_database_password',
  database: 'myapp_test',
}

// Synchronize models automatically
export const syncModels = process.env.NODE_ENV !== 'production'
```

Typescript Example:

```ts
// config/db.ts

import { Options } from '@nodepack/plugin-db-sequelize'

// Sequelize options object
// See https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor

export default {
  dialect: 'mysql',
  host: '127.0.0.1',
  username: 'your_database_user',
  password: 'your_database_password',
  database: 'myapp_test',
} as Options

// Synchronize models automatically
export const syncModels = process.env.NODE_ENV !== 'production'
```

### Sequelize Models

To create a sequelize model, create a file with the name of the model in the `src/models` folder, for example `User.js` for the `User` model.

It must export by default a function that gets the context and return a new model.

In the following examples, the `User` model will be added to the `models` object of the [Context](./context.md) so you can access it with `context.models.User`.

Javascript Example:

```js
// src/models/User.js

import { UUIDV4, STRING } from '@nodepack/plugin-db-sequelize'

/** @typedef {import('@nodepack/plugin-db-sequelize').SequelizeContext} SequelizeContext */

/**
 * @param {SequelizeContext} ctx
 */
export default (ctx) => ctx.sequelize.define('user', {
  id: {
    type: UUIDV4,
    primaryKey: true,
  },
  email: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  username: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: STRING,
    allowNull: false,
  },
})
```

Typescript Example:

```ts
// src/models/User.ts

import { SequelizeContext, UUIDV4, STRING } from '@nodepack/plugin-db-sequelize'

export default (ctx: SequelizeContext) => ctx.sequelize.define('user', {
  id: {
    type: UUIDV4,
    primaryKey: true,
  },
  email: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  username: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: STRING,
    allowNull: false,
  },
})
```

### Sequelize Usage in app

In the [Context](./context.md), you have access to the `sequelize` and the `models` object.

JavaScript Example:

```js
// src/index.js

import { bootstrap, printReady } from '@nodepack/app'

/** @typedef {import('@nodepack/plugin-db-knex').KnexContext} KnexContext */

/**
 * @param {KnexContext} ctx
 */
bootstrap(async (ctx) => {
  printReady()

  // You can access the Sequelize instance like this
  console.log(ctx.sequelize.getDialect())

  // Example query using sequelize models
  const users = await ctx.models.User.findAll()
  console.log(JSON.stringify(users, null, 2))
})
```

Typescript Example:

```ts
// src/index.ts

import { bootstrap, printReady } from '@nodepack/app'
import { KnexContext } from '@nodepack/plugin-db-knex'

bootstrap(async (ctx: KnexContext) => {
  printReady()

  // You can access the Sequelize instance like this
  console.log(ctx.sequelize.getDialect())

  // Example SQL query using knex
  console.log(await ctx.knex.table('nodepack_migration_records')
    .first())
})
```

## Fauna

[FaunaDB](https://fauna.com) is Cloud database suited for serverless and JAM Stack.

You can add it to your project if you don't have it already:

```
nodepack add db-fauna
```

### Fauna Configuration

Create a `config/db.js` or a `config/db.ts` file in your Nodepack project.

Javascript Example:

```js
// config/db.js

// Fauna configuration object
// See https://fauna.github.io/faunadb-js/Client.html

export default {
  // See https://docs.fauna.com/fauna/current/security/index.html
  secret: process.env.DB_SECRET,
}
```

Typescript Example:

```ts
// config/db.ts

// Fauna configuration object
// See https://fauna.github.io/faunadb-js/Client.html

import { ClientConfig } from 'faunadb'

export default {
  // See https://docs.fauna.com/fauna/current/security/index.html
  secret: process.env.DB_SECRET,
} as ClientConfig
```

### Fauna Usage in app

In the [Context](./context.md), you have access to the `fauna` object.

Javascript Example:

```js
// src/index.js

import { bootstrap, printReady } from '@nodepack/app'
import { query as q } from 'faunadb'

/** @typedef {import('@nodepack/plugin-db-fauna').FaunaContext} FaunaContext */

/**
 * @param {FaunaContext} ctx
 */
bootstrap(async (ctx) => {
  printReady()

  console.log(await ctx.fauna.query(
    q.Get(q.Collection('posts'))
  ))
})
```

Typescript Example:

```ts
// src/index.ts

import { bootstrap, printReady } from '@nodepack/app'
import { FaunaContext } from '@nodepack/plugin-db-fauna'

bootstrap(async (ctx: FaunaContext) => {
  printReady()

  console.log(await ctx.fauna.query(
    q.Get(q.Collection('posts'))
  ))
})
```

### Fauna Database Migrations

Create your [Database migrations](./db-migrations.md) in the `migration/db` folder in your Nodepack project.

Example migration:

```js
// migration/db/201908230224-posts.js

import { query as q } from 'faunadb'

/** @typedef {import('@nodepack/plugin-db-fauna').FaunaContext} FaunaContext */

/**
 * @param {FaunaContext} ctx
 */
exports.up = async (ctx) => {
  await ctx.fauna.query(
    q.CreateCollection({
      name: 'posts'
    })
  )
}

/**
 * @param {FaunaContext} ctx
 */
exports.down = async (ctx) => {
  await ctx.fauna.query(
    q.Delete(q.Collection('posts'))
  )
}
```
