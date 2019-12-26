const chalk = require('chalk')
const readline = require('readline')
const padStart = require('string.prototype.padstart')
const { hasSpinner } = require('./spinner')

function _log (type, tag, message) {
  // Secondary logging
  // (Not used yet)
}

const format = (label, msg) => {
  return msg.split('\n').map((line, i) => {
    return i === 0
      ? `${label} ${line}`
      : padStart(line, chalk.reset(label).length)
  }).join('\n')
}

const chalkTag = msg => chalk.bgBlackBright.white(` ${msg} `)

/**
 * @param {any} msg
 * @param {string?} tag
 */
exports.log = (msg = '', tag = null) => {
  tag ? console.log(format(chalkTag(tag), msg)) : console.log(msg)
  _log('log', tag, msg)
}

/**
 * @param {any} msg
 * @param {string?} tag
 */
exports.info = (msg, tag = null) => {
  if (hasSpinner()) console.log('')
  console.log(format(chalk.bgBlue.black(' INFO ') + (tag ? chalkTag(tag) : ''), msg))
  _log('info', tag, msg)
}

/**
 * @param {any} msg
 * @param {string?} tag
 */
exports.done = (msg, tag = null) => {
  if (hasSpinner()) console.log('')
  console.log(format(chalk.bgGreen.black(' DONE ') + (tag ? chalkTag(tag) : ''), msg))
  _log('done', tag, msg)
}

/**
 * @param {any} msg
 * @param {string?} tag
 */
exports.warn = (msg, tag = null) => {
  if (hasSpinner()) console.log('')
  console.warn(format(chalk.bgYellow.black(' WARN ') + (tag ? chalkTag(tag) : ''), chalk.yellow(msg)))
  _log('warn', tag, msg)
}

/**
 * @param {any} msg
 * @param {string?} tag
 */
exports.error = (msg, tag = null) => {
  if (hasSpinner()) console.log('')
  console.error(format(chalk.bgRed(' ERROR ') + (tag ? chalkTag(tag) : ''), chalk.red(msg)))
  _log('error', tag, msg)
  if (msg instanceof Error) {
    console.error(msg.stack)
    _log('error', tag, msg.stack)
  }
}

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
