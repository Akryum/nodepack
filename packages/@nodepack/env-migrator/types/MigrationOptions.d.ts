import MigrationWhenAPI from '../src/lib/MigrationWhenAPI'

export interface MigrationOptions {
  id: string
  title: string
  requirePlugins?: string[]
  when?: (api: MigrationWhenAPI) => boolean | Promise<boolean>
  migrate: () => void
  rollback?: () => void
}
