/**
 * @typedef PackageVersionsInfo
 * @prop {string?} current Current installed version
 * @prop {string?} wanted Wanted version depending on version range in package.json
 * @prop {string?} latest Latest version from registry (with 'latest' tag)
 */

const { default: chalk } = require('chalk')
const execa = require('execa')
const readline = require('readline')
const registries = require('./registries')
const shouldUseTaobao = require('./shouldUseTaobao')
const { request } = require('./request')
const { resolveModule } = require('@nodepack/module')
const semver = require('semver')
const path = require('path')
const fs = require('fs-extra')
const { warn, error } = require('./logger')
const LRU = require('lru-cache')

const TAOBAO_DIST_URL = 'https://npm.taobao.org/dist'

const metadataCache = new LRU({
  max: 200,
  maxAge: 3 * 60 * 1000,
})

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
      args.push(`--disturl=${TAOBAO_DIST_URL}`)
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

exports.getPackageMetadata = async function (id, range = '') {
  const cacheId = `${id}@${range}`
  const cached = metadataCache.get(cacheId)
  if (cached) return cached
  const registry = (await shouldUseTaobao())
    ? `https://registry.npm.taobao.org`
    : `https://registry.npmjs.org`
  let result
  try {
    result = await request.get(`${registry}/${encodeURIComponent(id).replace(/^%40/, '@')}/${range}`)
    if (result) metadataCache.set(cacheId, result)
  } catch (e) {
    warn(`Couldn't get medata for ${cacheId}: ${e.message}`)
    return null
  }
  return result
}

/**
 * @param {string} id Package id
 * @param {string} tag Release tag
 * @returns {Promise.<string?>}
 */
exports.getPackageTaggedVersion = async function (id, tag = 'latest') {
  try {
    const res = await exports.getPackageMetadata(id)
    if (res) res.body['dist-tags'][tag]
  } catch (e) {
    error(e)
  }
  return null
}

/**
 * @param {string} cwd Current working directory
 * @param {string} id Package id
 * @param {string} versionRange Wanted version range (ex: from package.json)
 * @returns {Promise.<PackageVersionsInfo>}
 */
exports.getPackageVersionsInfo = async function (cwd, id, versionRange) {
  /** @type {PackageVersionsInfo} */
  const result = {
    current: null,
    latest: null,
    wanted: null,
  }

  const pkgFile = path.resolve(exports.getPackageRoot(cwd, id), 'package.json')
  if (fs.existsSync(pkgFile)) {
    result.current = (await fs.readJson(pkgFile)).version
  }

  const metadata = await exports.getPackageMetadata(id)
  if (metadata) {
    result.latest = metadata['dist-tags'].latest

    const versions = Array.isArray(metadata.versions) ? metadata.versions : Object.keys(metadata.versions)
    result.wanted = semver.maxSatisfying(versions, versionRange)
  }

  return result
}

/**
 * @param {string} cwd Current working directory
 * @param {string} id Package id
 * @returns {string}
 */
exports.getPackageRoot = function (cwd, id) {
  const filePath = resolveModule(path.join(id, 'package.json'), cwd)
  if (!filePath) {
    return path.join(cwd, `node_modules`, id)
  }
  return path.dirname(filePath)
}
