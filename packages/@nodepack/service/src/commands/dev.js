const commonCommandOptions = require('../util/commonCommandOptions')
const os = require('os')

/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  api.registerCommand('dev', {
    description: 'Build and live-reload the app',
    usage: 'nodepack-service dev [entry]',
    options: {
      '-p, --port [port]': 'Specify a default port for process.env.PORT (it may automatically change if not available)',
      '--dbg [port]': 'Run the app in remote debugging mode, so a Node inspector can be attached',
      ...commonCommandOptions,
    },
  }, async (args) => {
    api.service.isWatching = true

    const path = require('path')
    const { terminate } = require('@nodepack/utils')
    const consola = require('consola')
    const chalk = require('chalk')
    const compilerInstance = require('../util/compilerInstance')
    const debounce = require('lodash/debounce')

    consola.info(chalk.blue('Building for development...'))

    // Entry
    const { getDefaultEntry } = require('../util/defaultEntry.js')
    options.entry = getDefaultEntry(api, options, args)

    const moreEnv = {
      ...process.env,
    }

    // Default port
    if (!process.env.PORT || args.port) {
      const { getDefaultPort } = require('../util/defaultPort')
      const port = await getDefaultPort(api, options, args)
      moreEnv.PORT = port.toString()
      if (api.service.env === 'development') {
        consola.info(`\`process.env.PORT\` has been set to ${port}`)
      }
    }

    // Build
    const webpack = require('webpack')
    const webpackConfig = await api.resolveWebpackConfig()
    const execa = require('execa')
    const { updateConfig } = require('../util/updateConfig')

    /** @type {import('child_process').ChildProcess} */
    let child
    let terminated = false
    let terminating = null

    const compiler = webpack(webpackConfig)
    compilerInstance.compiler = compiler

    // Implement pause to webpack compiler
    // For example, this is useful for error diagnostics
    injectPause(compiler)

    await updateConfig(api.getCwd(), {
      output: process.env.NODEPACK_DIRNAME,
    })

    compiler.watch(
      webpackConfig.watchOptions,
      debounce(async (err, stats) => {
        if (err) {
          consola.error(`Build error:`, err.stack || err)
        } else {
          // Kill previous process
          await terminateApp()
          if (child && moreEnv.PORT) {
            await waitForFreePort(parseInt(moreEnv.PORT))
          }

          if (process.env.NODEPACK_RAW_STATS) {
            console.log(stats.toString({
              colors: true,
            }))
          }

          if (stats.hasErrors()) {
            consola.error(`Build failed with errors.`)
          } else {
            if (child) {
              consola.info(chalk.blue('App restarting...'))
            } else {
              consola.info(chalk.blue('App starting...'))
            }

            terminated = false

            // Built entry file
            const file = api.resolve(path.join(webpackConfig.output.path, 'app.js'))

            // Spawn child process
            const currentChild = child = execa(process.argv0, [
              ...(args.dbg ? [`--inspect-brk=${args.dbg}`] : []),
              file,
            ], {
              stdio: [process.stdin, process.stdout, process.stderr],
              cwd: api.getCwd(),
              env: moreEnv,
              detached: os.platform() !== 'win32',
            })

            child.on('error', err => {
              consola.error(`App error:`, err.stack || err)
              terminated = true
            })

            child.on('exit', (code, signal) => {
              if (terminating !== currentChild) {
                if (code !== 0) {
                  consola.info(chalk.red(`App exited with error code ${code} and signal '${signal}'.`))
                } else {
                  consola.info(chalk.green('App exited, waiting for changes...'))
                }
              }
              terminated = true
              terminating = null
            })
          }
        }
      }, 500),
    )

    /** @type {Promise} */
    let terminatePromise

    async function terminateApp () {
      if (child && !terminated && terminating !== child) {
        terminating = child
        terminatePromise = new Promise(async (resolve) => {
          resolve(await killChild())
        })
        return terminatePromise
      } else if (terminating) {
        return terminatePromise
      } else {
        return terminated
      }
    }

    async function killChild () {
      try {
        const result = await terminate(child, api.getCwd())
        if (result.error) {
          throw result.error
        }
        child.kill('SIGINT')
        return true
      } catch (e) {
        consola.error(`Couldn't terminate process ${child.pid}:`, e.stack || e)
      }
    }

    const onExit = async () => {
      if (await terminateApp()) {
        process.exit(0)
      } else {
        consola.error(`Failed terminating app`)
        process.exit(1)
      }
    }
    process.on('SIGTERM', onExit)
    process.on('SIGINT', onExit)
  })
}

function injectPause (compiler) {
  compiler._nodepackPause = false
  const compile = compiler.compile
  compiler.compile = (...args) => {
    if (compiler._nodepackPause) return
    return compile.call(compiler, ...args)
  }
}

/**
 * @param {number} port
 * @returns {Promise.<boolean>}
 */
function isPortTaken (port) {
  return new Promise((resolve, reject) => {
    const net = require('net')
    const server = net.createServer()
    server.once('error', (/** @type {any} */ error) => {
      if (error.code !== 'EADDRINUSE') {
        reject(error)
      }
      resolve(true)
    })
    server.once('listening', () => {
      server.once('close', () => {
        resolve(false)
      })
      server.close()
    })
    server.listen(port)
  })
}

/**
 * @param {number} port
 * @returns {Promise.<boolean>}
 */
function waitForFreePort (port) {
  let count = 0
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        if (!await isPortTaken(port) || count > 10) {
          clearInterval(timer)
          resolve()
        } else {
          count++
        }
      } catch (e) {
        reject(e)
      }
    }, 500)
  })
}

// @ts-ignore
module.exports.defaultModes = {
  inspect: 'development',
}
