import globby from 'globby'
import { loadModule } from '@nodepack/module'
import fs from 'fs'
import path from 'path'
import consola from 'consola'

export interface Module {
  file: string
  up: Function
  down: Function
}

export async function findMigrations (cwd: string, folder: string) {
  const folderPath = path.join(cwd, folder)
  if (!fs.existsSync(folderPath)) {
    return []
  }
  let files = await globby(`${folder}/**/*.js`, {
    cwd,
  })
  files = files.sort((a, b) => a.localeCompare(b))
  return files
}

export async function loadMigrations (cwd: string, files: string[]) {
  const modules: Module[] = []
  files.forEach(file => {
    try {
      const code = loadModule(path.join(cwd, file), cwd, true)
      const { up = null, down = null } = code || {}
      if (!up && !down) {
        consola.warn(`No up or down functions exported in ${file}`)
      } else {
        modules.push({
          file,
          up,
          down,
        })
      }
    } catch (e) {
      consola.warn(`Error while loading migration ${file}: ${e.message}`)
    }
  })
  return modules
}
