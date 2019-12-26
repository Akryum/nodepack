#!/usr/bin/env node

const { checkDebug } = require('@nodepack/utils')
const { preInstall } = require('@nodepack/maintenance')
const Service = require('../lib/Service')

const cwd = process.env.NODEPACK_CONTEXT || process.cwd()

checkDebug(cwd)

const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv)
const command = args._[0]

async function run () {
  if (args.preInstall !== false) {
    await preInstall({
      cwd,
      cliOptions: args,
    })
  }

  const service = new Service(cwd)

  service.run(command, args, rawArgv).catch(err => {
    const consola = require('consola')
    consola.error(err)
    process.exit(1)
  })
}

run()
