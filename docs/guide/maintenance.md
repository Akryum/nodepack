# Maintenance

Some operations are automatically run during a maintenance:

- dependencies install (in case `package-lock.json` or `yarn.lock` has changed)
- [app migrations](./app-migrations.md) are checked and applied if necessary (this can result in modified project code or new dependencies installed)
- [environment migrations](./env-migrations.md) are checked and applied if necessary
- [database migrations](./db-migrations.md) are checked and applied if necessary

::: tip
In case at least one app migration is applied during the maintenance, the code state will be saved before and after applying the migrations with Git commits.
:::

Maintenances are automatically run when:

- The project is created.
- A plugin is added, upgraded or removed.
- A [service](./service.md) command is executed (you can skip this by setting the `NODEPACK_NO_MAINTENANCE` env variable to `true`).
