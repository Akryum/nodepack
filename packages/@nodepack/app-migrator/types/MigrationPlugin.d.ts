import MigratorAPI from '@nodepack/migrator/src/lib/MigrationAPI'

export type MigrationPlugin = (api: MigratorAPI) => void
