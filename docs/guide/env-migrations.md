# Environment Migrations

*Available soon...*

This second type of migrations is meant for the user specific environment. A typical example would be the Database, which needs to be created, seeded and updated as the development of the project progresses.

The big difference with the [app migrations](./app-migrations.md) is that the results of the migrations shouldn't be put into version control (like Git) because it depends on each user environment.

A environment migration can execute any code, for example SQL queries to update a developer Database schema after another developer on the same project made changes to the app.
