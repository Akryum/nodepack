const execa = require('execa')

let child
function start () {
  if (child) {
    child.kill()
  }

  child = execa(process.argv0, [
    require.resolve('./run'),
    ...process.argv.slice(2),
  ], {
    stdio: [process.stdin, process.stdout, process.stderr, 'ipc'],
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
    console.error('Nodepack process error:', error)
  })

  child.on('close', (code, signal) => {
    if (code === 75) {
      // @ts-ignore
      process.env._RESTARTED = true
      start()
    } else {
      if (code !== 0) {
        console.error(`Nodepack process exited with code ${code}`)
      }
      process.exitCode = code
    }
  })
}

start()
