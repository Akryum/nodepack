#!/usr/bin/env node

const { checkDebug } = require('@nodepack/utils')

checkDebug(process.cwd())

const Service = require('../lib/Service')
const service = new Service(process.env.NODEPACK_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv)
const command = args._[0]

service.run(command, args, rawArgv).catch(err => {
  const { error } = require('@nodepack/utils')
  error(err)
  process.exit(1)
})
