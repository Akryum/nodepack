# Maintenance

Some actions from you like creating a project will automatically trigger maintenances. They take care of a lot of things to keep your productive.

## What is it doing

Some operations are automatically run during a maintenance:

- dependencies install (in case `package-lock.json` or `yarn.lock` has changed)
- [app migrations](./app-migrations.md) are checked and applied if necessary (this can result in modified project code or new dependencies installed)
- fragments necessary for environment and database migrations such as [config.js](./config.md) and [context.js](./context.md) are built, which allow plugins and you to use the config and the context in them
- [environment migrations](./env-migrations.md) are checked and applied if necessary
- [database migrations](./db-migrations.md) are checked and applied if necessary

::: tip
In case at least one app migration is applied during the maintenance, the code state will be saved before and after applying the migrations with Git commits.
:::

## When is it run

Maintenances are automatically run when:

- The project is [created](./creating-a-project.md).
- A [plugin](./plugins.md) is added, upgraded or removed.
- A [service](./service.md) command is executed (you can skip this by setting the `NODEPACK_NO_MAINTENANCE` env variable to `true`).
