const execa = require('execa')
const path = require('path')
const fs = require('fs-extra')
const {
  isWindows,
  isLinux,
  isMacintosh,
} = require('./env')

exports.terminate = async function (childProcess, cwd) {
  if (isWindows) {
    try {
      const options = {
        stdio: ['pipe', 'pipe', 'ignore'],
      }
      if (cwd) {
        options.cwd = cwd
      }
      // @ts-ignore
      await execa('taskkill', ['/T', '/F', '/PID', childProcess.pid.toString()], options)
    } catch (err) {
      return { success: false, error: err }
    }
  } else if (isLinux || isMacintosh) {
    try {
      const cmd = path.resolve(__dirname, './terminate.sh')
      await fs.chmod(cmd, 0o777)
      const result = await execa(cmd, [childProcess.pid.toString()], {
        cwd,
      })
      if (result.failed) {
        return { success: false, error: result.stderr }
      }
    } catch (err) {
      return { success: false, error: err }
    }
  } else {
    childProcess.kill('SIGKILL')
  }
  return { success: true }
}
