/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('@nodepack/utils').Preset} Preset */

const path = require('path')
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
  error,
  chalk,
  getPkgCommand,
  hasGit,
  hasProjectGit,
  installDeps,
  sortObject,
  defaultPreset,
} = require('@nodepack/utils')
const { loadModule } = require('@nodepack/module')
const { Migrator, MigratorPlugin, MigrationOperationFile, writeFileTree } = require('@nodepack/app-migrator')
const generateReadme = require('../util/generateReadme')
const loadLocalPreset = require('../util/loadLocalPreset')
const loadRemotePreset = require('../util/loadRemotePreset')

// TODO presets
const isManualMode = true

module.exports = class Creator {
  constructor (projectName, targetDir, promptModules) {
    this.projectName = projectName
    this.cwd = process.env.NODEPACK_CONTEXT = targetDir
    // TODO
    this.promptModules = promptModules

    this.outroPrompts = this.resolveOutroPrompts()

    this.promptCompleteCbs = []
    this.createCompleteCbs = []

    this.run = this.run.bind(this)
  }

  /**
   * @param {any} cliOptions
   * @param {Preset?} preset
   */
  async create (cliOptions = {}, preset = null) {
    // Helpers
    const { run, projectName, cwd, createCompleteCbs } = this
    // Are one of those vars non-empty?
    const isTestOrDebug = !!(process.env.NODEPACK_TEST || process.env.NODEPACK_DEBUG)

    // Preset resolution
    if (!preset) {
      preset = await this.resolvePresetFromOptions(cliOptions)
    }

    // clone before mutating
    /** @type {Preset} */
    const finalPreset = cloneDeep(preset)

    await clearConsole()
    logWithSpinner(`✨`, `Creating project in ${chalk.yellow(cwd)}.`)

    // generate package.json with plugin dependencies
    await this.generatePkg(projectName, preset)

    // initialize git repository before installing deps
    // so that vue-cli-service can setup git hooks.
    const shouldInitGit = await this.shouldInitGit(cliOptions)
    if (shouldInitGit) {
      logWithSpinner(`🗃`, `Initializing git repository...`)
      await run('git init')
    }

    const packageManager = (
      cliOptions.packageManager ||
      loadGlobalOptions().packageManager ||
      getPkgCommand(cwd)
    )

    // install plugins
    stopSpinner()
    log(`⚙  Installing nodepack plugins. This might take a while...`)
    if (isTestOrDebug) {
      // in development, avoid installation process
      await require('../util/setupDevProject')(this.cwd)
    } else {
      await installDeps(cwd, packageManager, cliOptions.registry)
    }

    // run generator
    log(`🚀  Migrating app code...`)
    const plugins = await this.resolvePlugins(finalPreset.plugins)
    const migrator = new Migrator(cwd, {
      plugins,
      completeCbs: createCompleteCbs,
    })
    await migrator.migrate(finalPreset)

    // install additional deps (injected by generators)
    log(`📦  Installing additional dependencies...`)
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
    logWithSpinner('📄', 'Generating README.md...')
    await this.writeFileToDisk('README.md', generateReadme(migrator.pkg, packageManager))

    let gitCommitSuccess = true
    if (shouldInitGit) {
      gitCommitSuccess = await this.commitInitialState(cliOptions, isTestOrDebug)
    }

    // log instructions
    stopSpinner()
    log()
    log(`🎉  Successfully created project ${chalk.yellow(projectName)}.`)
    log(
      `👉  Get started with the following commands:\n\n` +
      (this.cwd === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${projectName}\n`)) +
      chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`)
    )
    log()

    if (!gitCommitSuccess) {
      warn(
        `Skipped git commit due to missing username and email in git config.\n` +
        `You will need to perform the initial commit yourself.\n`
      )
    }

    migrator.displayNotices()
  }

  /**
   * @returns {Promise.<Preset>}
   */
  async resolvePresetFromOptions (cliOptions) {
    /** @type {Preset?} */
    let preset = null
    if (cliOptions.preset) {
      // nodepack create foo --preset bar
      preset = await this.resolvePreset(cliOptions.preset, cliOptions.clone)
    } else if (cliOptions.default) {
      // nodepack create foo --default
      preset = defaultPreset
    } else if (cliOptions.inlinePreset) {
      // nodepack create foo --inlinePreset {...}
      try {
        preset = JSON.parse(cliOptions.inlinePreset)
      } catch (e) {
        error(`CLI inline preset is not valid JSON: ${cliOptions.inlinePreset}`)
        process.exit(1)
      }
    } else {
      preset = await this.promptAndResolvePreset()
    }
    return preset || {}
  }

  /**
   * @returns {Promise.<Preset?>}
   */
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

    /** @type {Preset?} */
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

  /**
   * @param {string} presetName
   * @param {boolean} clone
   */
  async resolvePreset (presetName, clone = false) {
    let preset = null
    const savedPresets = loadGlobalOptions().presets || {}

    if (presetName in savedPresets) {
      preset = savedPresets[presetName]
    } else if (presetName.endsWith('.json') || /^\./.test(presetName) || path.isAbsolute(presetName)) {
      preset = await loadLocalPreset(path.resolve(presetName))
    } else if (presetName.includes('/')) {
      logWithSpinner(`Fetching remote preset ${chalk.cyan(presetName)}...`)
      try {
        preset = await loadRemotePreset(presetName, clone)
        stopSpinner()
      } catch (e) {
        stopSpinner()
        error(`Failed fetching remote preset ${chalk.cyan(presetName)}:`)
        throw e
      }
    }

    // use default preset if user has not overwritten it
    if (presetName === 'default' && !preset) {
      preset = defaultPreset
    }
    if (!preset) {
      error(`preset "${presetName}" not found.`)
      const presets = Object.keys(savedPresets)
      if (presets.length) {
        log()
        log(`available presets:\n${presets.join(`\n`)}`)
      } else {
        log(`you don't seem to have any saved preset.`)
        log(`run 'nodepack create' in manual mode to create a preset.`)
      }
      process.exit(1)
    }
    return preset
  }

  async resolvePlugins (rawPlugins) {
    // ensure service is invoked first
    rawPlugins = sortObject(rawPlugins, ['@nodepack/service'], true)
    const plugins = []
    for (const id of Object.keys(rawPlugins)) {
      const apply = loadModule(`${id}/src/app-migrations`, this.cwd) || (() => {})
      const options = rawPlugins[id] || {}
      plugins.push(new MigratorPlugin(id, apply, options))
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
        choices: [
          {
            name: 'Use Yarn',
            value: 'yarn',
          },
          {
            name: 'Use NPM',
            value: 'npm',
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
   * @param {string} projectName
   * @param {Preset} preset
   */
  async generatePkg (projectName, preset) {
    // inject core service
    if (!preset.plugins) preset.plugins = {}
    preset.plugins['@nodepack/service'] = ''

    const pkg = {
      name: projectName,
      version: '0.1.0',
      private: true,
      devDependencies: {},
    }
    const deps = Object.keys(preset.plugins)
    for (const dep of deps) {
      pkg.devDependencies[dep] = (
        preset.plugins[dep] ||
        await this.getDepVersion(dep) ||
        'latest'
      )
    }
    // write package.json
    await this.writeFileToDisk('package.json', JSON.stringify(pkg, null, 2))
  }

  /**
   * @param {any} cliOptions
   * @param {boolean} isTestOrDebug
   * @returns {Promise.<boolean>} Git commit success
   */
  async commitInitialState (cliOptions, isTestOrDebug) {
    const { run } = this
    let success = true
    await run('git add -A')
    if (isTestOrDebug) {
      await run('git', ['config', 'user.name', 'test'])
      await run('git', ['config', 'user.email', 'test@test.com'])
    }
    const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
    try {
      await run('git', ['commit', '-m', msg])
    } catch (e) {
      success = false
    }
    return success
  }

  async writeFileToDisk (filename, source) {
    await writeFileTree(this.cwd, {
      [filename]: new MigrationOperationFile(this.cwd, filename, source, true),
    })
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
