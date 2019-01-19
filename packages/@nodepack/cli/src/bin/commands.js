const program = require('commander')
const { chalk, checkDebug } = require('@nodepack/utils')

checkDebug(process.cwd())

program
  .version(require('../../package.json').version)
  .usage('<command> [options]')

program
  .command('create <app-name>')
  .description('create a new project powered by nodepack')
  // Preset
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
  .option('-d, --default', 'Skip prompts and use the default preset')
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
  // Install
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-x, --proxy', 'Use specified proxy when creating project')
  // Git
  .option('-g, --git [message]', 'Force git initialization with initial commit message')
  .option('-n, --no-git', 'Skip git initialization')
  // Folder
  .option('-f, --force', 'Overwrite target directory if it exists')
  .action((appName, cmd) => {
    const options = cleanArgs(cmd)
    // --no-git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }
    require('../commands/create')(appName, options)
  })

program
  .command('add <plugin>')
  .description('add a plugin to the project')
  // Install
  .option('--no-install', `Don't try to install the plugin with package manager`)
  .option('--force-install', `Force installation with package manager even if already installed`)
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-x, --proxy', 'Use specified proxy when creating project')
  // Git
  .option('-g, --git [message]', 'Force git commit with message before maintenance')
  .option('-n, --no-git', 'Skip git commit before maintenance')
  .action((pluginName, cmd) => {
    const options = cleanArgs(cmd)
    // --no-git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }
    require('../commands/add')(pluginName, options)
  })

program
  .command('env-info')
  .description('print your environment infos for debugging')
  .option('-e, --env', 'Output env variables')
  .action((cmd) => {
    const options = cleanArgs(cmd)
    const { printEnvInfo } = require('@nodepack/env-check')
    printEnvInfo(options.env)
  })

// output help information on unknown commands
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
  })

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`nodepack <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessages = require('../util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

function camelize (str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs (cmd) {
  const args = {}
  cmd.options.forEach(o => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}
