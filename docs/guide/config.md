# Configuration

Every application or server usually needs to configure libraries and tools, for example a database driver to make queries.

Nodepack will automatically lookup for a `config` folder at the root of your project.

For example, you can create a `db.js` file:

```js
// config/db.js

export default {
  driver: 'pg',
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'my_app',
}
```

This will create a `db` configuration for your project.

Then you can use it in your code like this:

```js
import db from '@config/db'
```

Plugins will also take advantage of this system, so they can lookup for configuration in this `config` folder. For example, [database migrations](./db-migrations.md) will automatically try to connect to the database with the `db` configuration.

## Usage in context

*Available soon...*

You can retrieve a configuration in the [context](./context.md) with `context.config.someConfig`. If for example we want our `db` config:

```js
console.log(context.config.db)
```

## Usage in plugins

Use the `@nodepack/app-config` package to retrieve the user app configurations:

```js
// Will retrieve the `db` configuration
import { db } from '@nodepack/app-config'

if (db) {
  // ...
}
```
