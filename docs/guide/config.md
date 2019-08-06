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

## Standard configurations

Those configuration should be recognized by relevant plugins.

- `db`: main database connection information

It should return a connection info object. Example:

```js
// config/db.js
export default {
  type: 'pg',
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: '········',
}
```

- `redis`: redis connection information

Example:

```js
// config/redis.js
export default {
  host: 'localhost',
  port: 4002,
}
```

- `pubsub`: realtime events implementation

It should return an object of the following [interface](https://github.com/apollographql/graphql-subscriptions/blob/master/src/pubsub-engine.ts):

```ts
class PubSubEngine {
  public abstract publish(triggerName: string, payload: any): Promise<void>;
  public abstract subscribe(triggerName: string,
    onMessage: Function, options: Object): Promise<number>;
  public abstract unsubscribe(subId: number);
}
```

Example (in-memory):

```js
// config/pubsub.js
import { PubSub } from 'graphql-subscriptions'

export default new PusSub()
```

Example (redis):

```js
// config/pubsub.js
import { RedisPubSub } from 'graphql-redis-subscriptions'
import RedisConfig from './redis'

export default new RedisPubSub({
  connection: RedisConfig
})
```
