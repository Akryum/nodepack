import { MigrationPlugin } from '../lib/MigrationPlugin'
import { sortArray } from '@nodepack/utils'
import { loadModule } from '@nodepack/module'

export async function getMigratorPlugins (cwd: string, rawIds: string[]) {
  // ensure service is invoked first
  rawIds = sortArray(rawIds, ['@nodepack/service'], true)
  const plugins = []
  for (const id of rawIds) {
    const files = [
      `${id}/app-migrations`,
      `${id}/dist/app-migrations`,
      `${id}/src/app-migrations`,
    ]
    for (const file of files) {
      try {
        let apply = loadModule(file, cwd)
        if (apply.default) {
          apply = apply.default
        }
        if (!apply) continue
        plugins.push(new MigrationPlugin(id, apply))
        break
      } catch (e) {
        // File not found
      }
    }
  }
  return plugins
}
