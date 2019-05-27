const execa = require('execa')
const { default: chalk } = require('chalk')
const { request } = require('./request')
const inquirer = require('inquirer')
const registries = require('./registries')
const { loadGlobalOptions, saveGlobalOptions } = require('./globalOptions')

async function ping (registry) {
  await request.get(`${registry}/vue-cli-version-marker/latest`)
  return registry
}

function removeSlash (url) {
  return url.replace(/\/$/, '')
}

let checked
let result

module.exports = async function shouldUseTaobao (command = 'npm') {
  // ensure this only gets called once.
  if (checked) return result
  checked = true

  // previously saved preference
  const saved = loadGlobalOptions().useTaobaoRegistry
  if (typeof saved === 'boolean') {
    return (result = saved)
  }

  const save = val => {
    result = val
    saveGlobalOptions({ useTaobaoRegistry: val })
    return val
  }

  const userCurrent = (await execa(command, ['config', 'get', 'registry'])).stdout
  const defaultRegistry = registries[command]

  if (removeSlash(userCurrent) !== removeSlash(defaultRegistry)) {
    // user has configured custom registry, respect that
    return save(false)
  }

  let faster
  try {
    faster = await Promise.race([
      ping(defaultRegistry),
      ping(registries.taobao),
    ])
  } catch (e) {
    return save(false)
  }

  if (faster !== registries.taobao) {
    // default is already faster
    return save(false)
  }

  if (process.env.NODEPACK_API_MODE) {
    return save(true)
  }

  // ask and save preference
  const { useTaobaoRegistry } = await inquirer.prompt([
    {
      name: 'useTaobaoRegistry',
      type: 'confirm',
      message: chalk.yellow(
        ` Your connection to the default ${command} registry seems to be slow.\n` +
          `   Use ${chalk.cyan(registries.taobao)} for faster installation?`
      ),
    },
  ])
  return save(useTaobaoRegistry)
}
