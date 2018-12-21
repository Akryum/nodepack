import MigrationWhenAPI from '../src/lib/MigrationWhenAPI'
import MigrationOperationAPI from '../src/lib/MigrationOperationAPI'
import { Prompts } from 'inquirer'

export interface MigrationOptions {
  id: string
  title: string
  when?: (api: MigrationWhenAPI) => boolean | Promise<boolean>
  prompts?: (rootOptions: any) => Prompts | Promise<Prompts>
  migrate: (api: MigrationOperationAPI, options: any, rootOptions: any) => void
  rollback?: (api: MigrationOperationAPI, options: any, rootOptions: any) => void
}
