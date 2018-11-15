#!/usr/bin/env node

// @ts-ignore
var pkg = require('../../package.json')

var chalk = require('@moonreach/nodepack-utils').chalk
console.log(chalk.bold(pkg.name) + ' ' + chalk.blue(pkg.version))

// Env Check
if (require('@moonreach/env-check').checkNode(
  'nodepack',
  pkg.engines.node
)) {
  require('./process')
}
