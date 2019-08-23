const commonCommandOptions = require('../util/commonCommandOptions')

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
    const path = require('path')
    const { info, error, chalk, terminate } = require('@nodepack/utils')
    const compilerInstance = require('../util/compilerInstance')
    const debounce = require('lodash/debounce')

    info(chalk.blue('Building for development...'))

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
        info(`\`process.env.PORT\` has been set to ${port}`)
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
          error(err)
        } else {
          // Kill previous process
          await terminateApp()
          if (child && moreEnv.PORT) {
            await waitForFreePort(parseInt(moreEnv.PORT))
          }

          if (stats.hasErrors()) {
            error(`Build failed with errors.`)
            if (process.env.NODEPACK_RAW_STATS) {
              console.log(stats.toString({
                colors: true,
              }))
            }
          } else {
            if (child) {
              info(chalk.blue('App restarting...'))
            } else {
              info(chalk.blue('App starting...'))
            }

            terminated = false

            // Built entry file
            const file = api.resolve(path.join(webpackConfig.output.path, 'app.js'))

            // Spawn child process
            const currentChild = child = execa('node', [
              ...(args.dbg ? [`--inspect-brk=${args.dbg}`] : []),
              file,
            ], {
              stdio: [process.stdin, process.stdout, process.stderr],
              cwd: api.getCwd(),
              shell: false,
              env: moreEnv,
              detached: true,
            })

            child.on('error', err => {
              error(err)
              terminated = true
            })

            child.on('exit', (code, signal) => {
              if (terminating !== currentChild) {
                if (code !== 0) {
                  info(chalk.red(`App exited with error code ${code} and signal '${signal}'.`))
                } else {
                  info(chalk.green('App exited, waiting for changes...'))
                }
              }
              terminated = true
            })
          }
        }
      }, 500)
    )

    async function terminateApp () {
      if (child && !terminated && terminating !== child) {
        terminating = child
        try {
          const result = await terminate(child, api.getCwd())
          if (result.error) {
            throw result.error
          }
          child.kill('SIGINT')
          return true
        } catch (e) {
          error(`Couldn't terminate process ${child.pid}: ${e}`)
        }
      }
      return terminated
    }

    const onExit = async () => {
      if (await terminateApp()) {
        process.exit(0)
      } else {
        error(`Failed terminating app`)
        process.exit(1)
      }
    }
    process.on('SIGTERM', onExit)
    process.on('SIGINT', onExit)
  })
}

function injectPause (compiler) {
  compiler.$_pause = false
  const compile = compiler.compile
  compiler.compile = (...args) => {
    if (compiler.$_pause) return
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
