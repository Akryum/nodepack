import MigrationWhenAPI from '../src/lib/MigrationWhenAPI'
import MigrationOperationAPI from '../src/lib/MigrationOperationAPI'
import { Question } from 'inquirer'

export interface MigrationOptions {
  id: string
  title: string
  requirePlugins?: string[]
  when?: (api: MigrationWhenAPI) => boolean | Promise<boolean>
  prompts?: (rootOptions: any) => Question[] | Promise<Question[]>
  up: (api: MigrationOperationAPI, options: any, rootOptions: any) => void
  down?: (api: MigrationOperationAPI, options: any, rootOptions: any) => void
}
