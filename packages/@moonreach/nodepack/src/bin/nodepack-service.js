#!/usr/bin/env node

// Don't use any fancy syntax in this file
// It should run one old versions on node

// @ts-ignore
var pkg = require('../../package.json')

var chalk = require('chalk').default
console.log(chalk.bold(pkg.name) + ' ' + chalk.blue(pkg.version))

// Env Check
if (require('@moonreach/env-check').checkNode(
  'nodepack',
  pkg.engines.node
)) {
  require('./process')
}
