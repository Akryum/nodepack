import { MigrationPlugin } from '../lib/MigrationPlugin'
import { matchesPluginId } from '@nodepack/plugins-resolution'
import { resolveModule } from '@nodepack/module'
import path from 'path'
import fs from 'fs-extra'

export function hasPlugin (id: string, plugins: MigrationPlugin[], pkg: any) {
  return [
    ...plugins.map(p => p.id),
    ...Object.keys(pkg.devDependencies),
    ...Object.keys(pkg.dependencies),
  ].some(name => matchesPluginId(id, name))
}

export function getVersion (id: string, cwd: string): string {
  const file = resolveModule(path.join(id, 'package.json'), cwd)
  if (file) {
    const pkg = fs.readJSONSync(file)
    return pkg.version
  }
  return null
}
