#!/usr/bin/env node

// Don't use any fancy syntax in this file
// It should run one old versions on node

// @ts-ignore
const pkg = require('../../package.json')

if (process.argv.indexOf('--version') === -1) {
  const chalk = require('chalk')
  console.log(chalk.bold(pkg.name) + ' ' + chalk.blue(pkg.version))
}

// Env Check
if (require('@nodepack/env-check').checkNode(
  'nodepack',
  pkg.engines.node,
)) {
  require('./commands')
}
