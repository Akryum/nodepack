import MigratorAPI from '../src/lib/MigrationAPI'

export type MigrationPlugin = (api: MigratorAPI) => void
