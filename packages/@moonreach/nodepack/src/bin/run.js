#!/usr/bin/env node

const { info } = require('@moonreach/nodepack-utils')
const fs = require('fs')
const path = require('path')
const slash = require('slash')

// Enter debug mode when creating test repo
if (
  slash(process.cwd()).indexOf('/packages/test') > 0 && (
    fs.existsSync(path.resolve(process.cwd(), '../@moonreach')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@moonreach'))
  )
) {
  // @ts-ignore
  process.env.NODEPACK_DEBUG = true
  info('Debug mode enabled')
}

const Service = require('../lib/Service')
const service = new Service(process.env.NODEPACK_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv)
const command = args._[0]

service.run(command, args, rawArgv).catch(err => {
  const { error } = require('@moonreach/nodepack-utils')
  error(err)
  process.exit(1)
})
