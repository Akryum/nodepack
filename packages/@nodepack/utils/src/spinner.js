const ora = require('ora')
const chalk = require('chalk')
const readline = require('readline')

const spinner = ora()
let lastMsg = null

exports.logWithSpinner = (symbol, msg) => {
  if (!msg) {
    msg = symbol
    symbol = chalk.green('✔')
  }
  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text,
    })
  }
  spinner.text = ' ' + msg
  lastMsg = {
    symbol: symbol + ' ',
    text: msg,
  }
  spinner.start()
}

exports.stopSpinner = (persist) => {
  if (lastMsg && persist !== false) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text,
    })
  } else {
    spinner.stop()
  }
  lastMsg = null
}

exports.pauseSpinner = () => {
  spinner.stop()
}

exports.resumeSpinner = () => {
  spinner.start()
}

exports.hasSpinner = () => !!lastMsg

/**
 * @param {string?} [title]
 */
exports.clearConsole = title => {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows || 100)
    console.log(blank)
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout)
    if (title) {
      console.log(title)
    }
  }
}
