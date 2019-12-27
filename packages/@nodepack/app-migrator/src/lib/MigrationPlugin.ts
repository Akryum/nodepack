import { MigrationAPI } from './MigrationAPI'

export type MigrationPluginApply = (api: MigrationAPI) => void

export class MigrationPlugin {
  id: string
  apply: MigrationPluginApply
  currentVersion: string = null
  previousVersion: string = null

  constructor (id: string, apply: MigrationPluginApply) {
    this.id = id
    this.apply = apply
  }

  get isFirstInstall () {
    return this.previousVersion == null
  }
}
