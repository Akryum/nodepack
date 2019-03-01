const execa = require('execa')

let child
function start () {
  if (child) {
    child.kill()
  }

  child = execa('node', [
    require.resolve('./run'),
    ...process.argv.slice(2),
  ], {
    stdio: [process.stdin, process.stdout, process.stderr, 'ipc'],
    cwd: process.cwd(),
    cleanup: true,
    shell: false,
    env: process.env,
  })

  child.on('message', message => {
    if (message && message.restart) {
      // @ts-ignore
      if (message.restart.reason == null) {
        delete process.env._RESTART_REASON
      } else {
        process.env._RESTART_REASON = message.restart.reason
      }
    }
  })

  child.on('error', (error) => {
    console.log(error)
  })

  child.on('close', (code, signal) => {
    if (code === 75) {
      // @ts-ignore
      process.env._RESTARTED = true
      start()
    } else {
      process.exitCode = code
    }
  })
}

start()
