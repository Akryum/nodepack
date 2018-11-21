/** @typedef {import('inquirer').Question} Question */

const inquirer = require('inquirer')
const execa = require('execa')
const cloneDeep = require('lodash.clonedeep')
const getPackageVersion = require('../util/getPackageVersion')
const {
  loadGlobalOptions,
  saveGlobalOptions,
  clearConsole,
  logWithSpinner,
  stopSpinner,
  log,
  warn,
  chalk,
  getPkgCommand,
  hasGit,
  hasProjectGit,
  installDeps,
  sortObject,
  loadModule,
} = require('@moonreach/nodepack-utils')
const { Generator, GeneratorFile, writeFileTree } = require('@moonreach/nodepack-generator')
const generateReadme = require('../util/generateReadme')

// TODO presets
const isManualMode = true

module.exports = class Creator {
  constructor (name, targetDir, promptModules) {
    this.name = name
    this.cwd = process.env.NODEPACK_CONTEXT = targetDir
    // TODO
    this.promptModules = promptModules

    this.outroPrompts = this.resolveOutroPrompts()

    this.promptCompleteCbs = []
    this.createCompleteCbs = []

    this.run = this.run.bind(this)
  }

  async create (cliOptions = {}, preset = null) {
    const isTestOrDebug = process.env.NODEPACK_TEST || process.env.NODEPACK_DEBUG
    const { run, name, cwd, createCompleteCbs } = this

    // TODO preset
    preset = await this.promptAndResolvePreset()

    // clone before mutating
    preset = cloneDeep(preset)
    // inject core service
    preset.plugins['@moonreach/nodepack'] = Object.assign({
      projectName: name,
    }, preset)

    const packageManager = (
      cliOptions.packageManager ||
      loadGlobalOptions().packageManager ||
      getPkgCommand(cwd)
    )

    await clearConsole()
    logWithSpinner(`✨`, `Creating project in ${chalk.yellow(cwd)}.`)

    // generate package.json with plugin dependencies
    const pkg = {
      name,
      version: '0.1.0',
      private: true,
      devDependencies: {},
    }
    const deps = Object.keys(preset.plugins)
    for (const dep of deps) {
      if (preset.plugins[dep]._isPreset) {
        return
      }
      pkg.devDependencies[dep] = (
        preset.plugins[dep].version ||
        await this.getDepVersion(dep) ||
        'latest'
      )
    }
    // write package.json
    await this.writeFileToDisk('package.json', JSON.stringify(pkg, null, 2))

    // initialize git repository before installing deps
    // so that vue-cli-service can setup git hooks.
    const shouldInitGit = await this.shouldInitGit(cliOptions)
    if (shouldInitGit) {
      logWithSpinner(`🗃`, `Initializing git repository...`)
      await run('git init')
    }

    // install plugins
    stopSpinner()
    log(`⚙  Installing nodepack plugins. This might take a while...`)
    log()
    if (isTestOrDebug) {
      // in development, avoid installation process
      // await require('./util/setupDevProject')(context)
    } else {
      await installDeps(cwd, packageManager, cliOptions.registry)
    }

    // run generator
    log(`🚀  Invoking generators...`)
    const plugins = await this.resolvePlugins(preset.plugins)
    const generator = new Generator(cwd, {
      pkg,
      plugins,
      completeCbs: createCompleteCbs,
      invoking: false,
    })
    await generator.generate({
      extractConfigFiles: preset.useConfigFiles,
    })

    // install additional deps (injected by generators)
    log(`📦  Installing additional dependencies...`)
    log()
    if (!isTestOrDebug) {
      await installDeps(cwd, packageManager, cliOptions.registry)
    }

    // run complete cbs if any (injected by generators)
    logWithSpinner('⚓', `Running completion hooks...`)
    for (const cb of createCompleteCbs) {
      await cb()
    }

    // generate README.md
    stopSpinner()
    log()
    logWithSpinner('📄', 'Generating README.md...')
    await this.writeFileToDisk('README.md', generateReadme(generator.pkg, packageManager))

    // commit initial state
    let gitCommitFailed = false
    if (shouldInitGit) {
      await run('git add -A')
      if (isTestOrDebug) {
        await run('git', ['config', 'user.name', 'test'])
        await run('git', ['config', 'user.email', 'test@test.com'])
      }
      const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
      try {
        await run('git', ['commit', '-m', msg])
      } catch (e) {
        gitCommitFailed = true
      }
    }

    // log instructions
    stopSpinner()
    log()
    log(`🎉  Successfully created project ${chalk.yellow(name)}.`)
    log(
      `👉  Get started with the following commands:\n\n` +
      (this.cwd === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
      chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`)
    )
    log()

    if (gitCommitFailed) {
      warn(
        `Skipped git commit due to missing username and email in git config.\n` +
        `You will need to perform the initial commit yourself.\n`
      )
    }

    generator.printExitLogs()
  }

  async writeFileToDisk (filename, source) {
    await writeFileTree(this.cwd, {
      [filename]: new GeneratorFile(filename, source, true),
    })
  }

  async promptAndResolvePreset (answers = null) {
    // prompt
    if (!answers) {
      await clearConsole()
      answers = await inquirer.prompt(this.resolveFinalPrompts())
    }

    if (answers.packageManager) {
      saveGlobalOptions({
        packageManager: answers.packageManager,
      })
    }

    let preset
    if (answers.preset && answers.preset !== '__manual__') {
      preset = await this.resolvePreset(answers.preset)
    } else {
      // manual
      preset = {
        useConfigFiles: answers.useConfigFiles === 'files',
        plugins: {},
      }
      answers.features = answers.features || []
      // run cb registered by prompt modules to finalize the preset
      this.promptCompleteCbs.forEach(cb => cb(answers, preset))
    }

    // validate
    // TODO

    // save preset
    if (answers.save && answers.saveName) {
      // TODO
    }

    return preset
  }

  async resolvePreset (presetName) {
    // TODO
    return {
      plugins: {},
    }
  }

  // { id: options } => [{ id, apply, options }]
  async resolvePlugins (rawPlugins) {
    // ensure cli-service is invoked first
    rawPlugins = sortObject(rawPlugins, ['@moonreach/nodepack'], true)
    const plugins = []
    for (const id of Object.keys(rawPlugins)) {
      const apply = loadModule(`${id}/generator`, this.cwd) || (() => {})
      let options = rawPlugins[id] || {}
      if (options.prompts) {
        const prompts = loadModule(`${id}/prompts`, this.cwd)
        if (prompts) {
          log()
          log(`${chalk.cyan(options._isPreset ? `Preset options:` : id)}`)
          options = await inquirer.prompt(prompts)
        }
      }
      plugins.push({ id, apply, options })
    }
    return plugins
  }

  run (command, args) {
    if (!args) { [command, ...args] = command.split(/\s+/) }
    return execa(command, args, { cwd: this.cwd })
  }

  resolveOutroPrompts () {
    /** @type {Question []} */
    const outroPrompts = [
      {
        name: 'useConfigFiles',
        when: isManualMode,
        type: 'list',
        message: 'Where do you prefer placing config for Babel, ESLint, etc.?',
        choices: [
          {
            name: 'In dedicated config files',
            value: 'files',
          },
          {
            name: 'In package.json',
            value: 'pkg',
          },
        ],
      },
      // {
      //   name: 'save',
      //   when: isManualMode,
      //   type: 'confirm',
      //   message: 'Save this as a preset for future projects?',
      //   default: false,
      // },
      // {
      //   name: 'saveName',
      //   when: answers => answers.save,
      //   type: 'input',
      //   message: 'Save preset as:',
      // },
    ]

    // ask for packageManager once
    const savedOptions = loadGlobalOptions()
    if (!savedOptions.packageManager && getPkgCommand(this.cwd) === 'yarn') {
      outroPrompts.push({
        name: 'packageManager',
        type: 'list',
        message: 'Pick the package manager to use when installing dependencies:',
        // @ts-ignore
        choices: [
          {
            name: 'Use Yarn',
            value: 'yarn',
            short: 'Yarn',
          },
          {
            name: 'Use NPM',
            value: 'npm',
            short: 'NPM',
          },
        ],
      })
    }

    return outroPrompts
  }

  resolveFinalPrompts () {
    const prompts = [
      ...this.outroPrompts,
    ]
    return prompts
  }

  /**
   * @param {string} dep Dep id
   * @returns {Promise.<string?>}
   */
  async getDepVersion (dep) {
    try {
      const res = await getPackageVersion(dep)
      return res.body['dist-tags'].latest
    } catch (e) {
      return null
    }
  }

  async shouldInitGit (cliOptions) {
    if (!hasGit()) {
      return false
    }
    // --git
    if (cliOptions.forceGit) {
      return true
    }
    // --no-git
    if (cliOptions.git === false || cliOptions.git === 'false') {
      return false
    }
    // default: true unless already in a git repo
    return !hasProjectGit(this.cwd)
  }
}
