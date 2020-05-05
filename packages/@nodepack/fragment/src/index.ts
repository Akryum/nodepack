import path from 'path'
import { loadModule } from '@nodepack/module'
import { readConfigFileSync } from './configFiles'

function getOutputConfig (cwd: string): any {
  const config = readConfigFileSync(cwd, 'config.json')
  return config.output
}

export function loadFragment<T = any> (file: string, cwd: string = process.cwd()): T {
  try {
    const outputDir = process.env.NODEPACK_DIRNAME || getOutputConfig(cwd) || process.cwd()
    const moduleFile = path.join(outputDir, file)
    return loadModule(moduleFile, outputDir)
  } catch (e) {
    console.log(`Error while loading fragment ${file}`, e)
    return null
  }
}
