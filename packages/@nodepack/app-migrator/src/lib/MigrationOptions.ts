import { MigrationWhenAPI } from './MigrationWhenAPI'
import { MigrationOperationAPI } from './MigrationOperationAPI'
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
