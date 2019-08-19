/** @typedef {import('@nodepack/utils').Preset} Preset */

/**
 * @typedef TestProject
 * @prop {string} dir
 * @prop {(file: string) => boolean} has
 * @prop {(file: string) => Promise.<string>} read
 * @prop {(file: string, content: string) => Promise<void>} write
 * @prop {(command: string, args: string[]) => Promise} run
 * @prop {(file: string) => Promise.<void>} rm
 */

const path = require('path')
const fs = require('fs-extra')
const execa = require('execa')
const { chalk } = require('@nodepack/utils')

/**
 * @param {string} cwd
 * @param {string} projectName
 * @param {Preset} preset
 * @param {boolean} initGit
 * @returns {Promise.<TestProject>}
 */
exports.createTestProject = async (cwd, projectName, preset, initGit = false) => {
  delete process.env.NODEPACK_SKIP_WRITE

  cwd = cwd || path.resolve(__dirname, '../../../test/')

  const projectRoot = path.resolve(cwd, projectName)

  const read = file => {
    return fs.readFile(path.resolve(projectRoot, file), 'utf-8')
  }

  const has = file => {
    return fs.existsSync(path.resolve(projectRoot, file))
  }

  if (has(projectRoot)) {
    console.warn(chalk.yellow(`An existing test project already exists for ${name}. May get unexpected test results due to project re-use`))
  }

  const write = (file, content) => {
    const targetPath = path.resolve(projectRoot, file)
    const dir = path.dirname(targetPath)
    return fs.ensureDir(dir).then(() => fs.writeFile(targetPath, content))
  }

  const rm = file => {
    return fs.remove(path.resolve(projectRoot, file))
  }

  const run = (command, args) => {
    [command, ...args] = command.split(/\s+/)
    if (command === 'nodepack-service') {
      // appveyor has problem with paths sometimes
      command = require.resolve('@nodepack/service/src/bin/nodepack-service')
    }
    return execa(command, args, { cwd: projectRoot })
  }

  const cliBinPath = require.resolve('@nodepack/cli/src/bin/nodepack')

  const args = [
    'create',
    projectName,
    '--force',
    '--inlinePreset',
    JSON.stringify(preset),
    '--git',
    initGit ? 'init' : 'false',
  ]

  await execa(cliBinPath, args, {
    cwd,
    stdio: 'inherit',
  })

  return {
    dir: projectRoot,
    has,
    read,
    write,
    run,
    rm,
  }
}
