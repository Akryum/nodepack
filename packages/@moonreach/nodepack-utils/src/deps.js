const { default: chalk } = require('chalk')
const execa = require('execa')
const readline = require('readline')
const registries = require('./registries')
const shouldUseTaobao = require('./shouldUseTaobao')

const taobaoDistURL = 'https://npm.taobao.org/dist'

function toStartOfLine (stream) {
  if (!chalk.supportsColor) {
    stream.write('\r')
    return
  }
  readline.cursorTo(stream, 0)
}

function renderProgressBar (curr, total) {
  const ratio = Math.min(Math.max(curr / total, 0), 1)
  const bar = ` ${curr}/${total}`
  const availableSpace = Math.max(0, (process.stderr.columns || 100) - bar.length - 3)
  const width = Math.min(total, availableSpace)
  const completeLength = Math.round(width * ratio)
  const complete = `#`.repeat(completeLength)
  const incomplete = `-`.repeat(width - completeLength)
  toStartOfLine(process.stderr)
  process.stderr.write(`[${complete}${incomplete}]${bar}`)
}

async function addRegistryToArgs (command, args, cliRegistry) {
  const altRegistry = (
    cliRegistry || (
      (await shouldUseTaobao(command))
        ? registries.taobao
        : null
    )
  )

  if (altRegistry) {
    args.push(`--registry=${altRegistry}`)
    if (altRegistry === registries.taobao) {
      args.push(`--disturl=${taobaoDistURL}`)
    }
  }
}

function executeCommand (command, args, targetDir) {
  return new Promise((resolve, reject) => {
    const apiMode = process.env.VUE_CLI_API_MODE

    if (apiMode) {
      if (command === 'npm') {
        // TODO when this is supported
      } else if (command === 'yarn') {
        args.push('--json')
      }
    }

    const child = execa(command, args, {
      cwd: targetDir,
      stdio: ['inherit', apiMode ? 'pipe' : 'inherit', !apiMode && command === 'yarn' ? 'pipe' : 'inherit'],
    })

    // filter out unwanted yarn output
    if (command === 'yarn') {
      child.stderr.on('data', buf => {
        const str = buf.toString()
        if (/warning/.test(str)) {
          return
        }

        // progress bar
        const progressBarMatch = str.match(/\[.*\] (\d+)\/(\d+)/)
        if (progressBarMatch) {
          // since yarn is in a child process, it's unable to get the width of
          // the terminal. reimplement the progress bar ourselves!
          renderProgressBar(progressBarMatch[1], progressBarMatch[2])
          return
        }

        process.stderr.write(buf)
      })
    }

    child.on('close', code => {
      if (code !== 0) {
        reject(`command failed: ${command} ${args.join(' ')}`)
        return
      }
      resolve()
    })
  })
}

exports.installDeps = async function installDeps (targetDir, command, cliRegistry) {
  const args = []
  if (command === 'npm') {
    args.push('install', '--loglevel', 'error')
  } else if (command === 'yarn') {
    // do nothing
  } else {
    throw new Error(`Unknown package manager: ${command}`)
  }

  await addRegistryToArgs(command, args, cliRegistry)

  await executeCommand(command, args, targetDir)
}

exports.installPackage = async function (targetDir, command, cliRegistry, packageName, dev = true) {
  const args = []
  if (command === 'npm') {
    args.push('install', '--loglevel', 'error')
  } else if (command === 'yarn') {
    args.push('add')
  } else {
    throw new Error(`Unknown package manager: ${command}`)
  }

  if (dev) args.push('-D')

  await addRegistryToArgs(command, args, cliRegistry)

  args.push(packageName)

  await executeCommand(command, args, targetDir)
}

exports.uninstallPackage = async function (targetDir, command, cliRegistry, packageName) {
  const args = []
  if (command === 'npm') {
    args.push('uninstall', '--loglevel', 'error')
  } else if (command === 'yarn') {
    args.push('remove')
  } else {
    throw new Error(`Unknown package manager: ${command}`)
  }

  await addRegistryToArgs(command, args, cliRegistry)

  args.push(packageName)

  await executeCommand(command, args, targetDir)
}

exports.updatePackage = async function (targetDir, command, cliRegistry, packageName) {
  const args = []
  if (command === 'npm') {
    args.push('update', '--loglevel', 'error')
  } else if (command === 'yarn') {
    args.push('upgrade')
  } else {
    throw new Error(`Unknown package manager: ${command}`)
  }

  await addRegistryToArgs(command, args, cliRegistry)

  packageName.split(' ').forEach(name => args.push(name))

  await executeCommand(command, args, targetDir)
}
