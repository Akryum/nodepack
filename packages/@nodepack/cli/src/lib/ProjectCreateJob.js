/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('inquirer').ChoiceType} ChoiceType */
/** @typedef {import('@nodepack/utils').Preset} Preset */
/** @typedef {import('./CreateModuleAPI')} CreateModuleAPI */

/** @typedef {(api: CreateModuleAPI) => void} CreateModule */

// API
const CreateModuleAPI = require('./CreateModuleAPI')
// Utils
const { Maintenance } = require('@nodepack/maintenance')
const path = require('path')
const inquirer = require('inquirer')
const execa = require('execa')
const cloneDeep = require('lodash.clonedeep')
const {
  loadGlobalOptions,
  saveGlobalOptions,
  defaultGlobalOptions,
  clearConsole,
  logWithSpinner,
  stopSpinner,
  log,
  warn,
  error,
  chalk,
  getPkgCommand,
  installDeps,
  defaultPreset,
  getPackageTaggedVersion,
  shouldUseGit,
  commitOnGit,
} = require('@nodepack/utils')
const { MigrationOperationFile, writeFileTree } = require('@nodepack/app-migrator')
const generateReadme = require('../util/generateReadme')
const loadLocalPreset = require('../util/loadLocalPreset')
const loadRemotePreset = require('../util/loadRemotePreset')
const { formatFeatures } = require('../util/features')

const isManualMode = answers => answers.preset === '__manual__'

module.exports = class ProjectCreateJob {
  /**
   * @param {string} projectName
   * @param {string} targetDir
   * @param {CreateModule []} createModules
   */
  constructor (projectName, targetDir, createModules) {
    this.projectName = projectName
    this.cwd = process.env.NODEPACK_CONTEXT = targetDir
    this.createModules = createModules

    const { presetPrompt, featurePrompt } = this.resolveIntroPrompts()
    this.presetPrompt = presetPrompt
    this.featurePrompt = featurePrompt
    /** @type {Question []} */
    this.injectedPrompts = []
    this.outroPrompts = this.resolveOutroPrompts()

    /** @type {function []} */
    this.promptCompleteCbs = []

    this.run = this.run.bind(this)
  }

  /**
   * @param {any} cliOptions
   * @param {Preset?} preset
   */
  async create (cliOptions = {}, preset = null) {
    const { run, projectName, cwd } = this

    // Apply create modules
    const createModuleAPI = new CreateModuleAPI(this)
    for (const createModule of this.createModules) {
      await createModule(createModuleAPI)
    }

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
    const shouldInitGit = await shouldUseGit(this.cwd, cliOptions)
    if (shouldInitGit) {
      logWithSpinner(`🗃`, `Initializing git repository...`)
      await run('git init')
    }

    const maintenance = new Maintenance({
      cwd,
      cliOptions,
      preset: finalPreset,
      skipCommit: true,
      skipPreInstall: true,
      before: async ({ packageManager, isTestOrDebug }) => {
        // install plugins
        stopSpinner()
        log(`⚙  Installing nodepack plugins. This might take a while...`)
        if (isTestOrDebug) {
          // in development, avoid installation process
          await require('../util/setupDevProject')(cwd)
        } else {
          await installDeps(cwd, packageManager, cliOptions.registry)
        }
      },
      after: async ({ results, pkg, packageManager, isTestOrDebug }) => {
        // If migrations prompted the user, we need to get them in case we save the preset
        finalPreset.appMigrations = results.appMigrationAllOptions

        // generate README.md
        stopSpinner()
        logWithSpinner('📄', 'Generating README.md...')
        await this.writeFileToDisk('README.md', generateReadme(pkg, packageManager))

        // initial commit
        let gitCommitSuccess = true
        if (shouldInitGit) {
          gitCommitSuccess = await commitOnGit(cliOptions, isTestOrDebug)
        }
        stopSpinner()

        // save preset
        if (this.isPresetManual) {
          await this.askSavePreset(finalPreset)
        }

        // log instructions
        log()
        log(`🎉  Successfully created project ${chalk.yellow(projectName)}.`)
        log(
          `👉  Get started with the following commands:\n\n` +
          (cwd === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${projectName}\n`)) +
          chalk.cyan(` ${chalk.gray('$')} nodepack`)
        )
        log()

        if (!gitCommitSuccess) {
          warn(
            `Skipped git commit due to missing username and email in git config.\n` +
            `You will need to perform the initial commit yourself.\n`
          )
        }
      },
    })

    await maintenance.run()
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
      for (const cb of this.promptCompleteCbs) {
        await cb(answers, preset)
      }
    }

    // validate
    // TODO

    this.isPresetManual = answers.preset === '__manual__'

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

  getPresets () {
    const savedOptions = loadGlobalOptions()
    return Object.assign({}, savedOptions.presets, defaultGlobalOptions.presets)
  }

  resolveIntroPrompts () {
    const presets = this.getPresets()
    const presetChoices = Object.keys(presets).map(name => {
      return {
        name: `${name} (${formatFeatures(presets[name])})`,
        value: name,
      }
    })
    const presetPrompt = {
      name: 'preset',
      type: 'list',
      message: `Please pick a preset:`,
      choices: [
        ...presetChoices,
        {
          name: 'Manually select features',
          value: '__manual__',
        },
      ],
    }
    const featurePrompt = {
      name: 'features',
      when: isManualMode,
      type: 'checkbox',
      message: 'Check the features needed for your project:',
      /** @type {ChoiceType []} */
      choices: [],
      pageSize: 10,
    }
    return {
      presetPrompt,
      featurePrompt,
    }
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
    // Skip injected prompts from create modules
    // if not in manual mode
    this.injectedPrompts.forEach(prompt => {
      const originalWhen = prompt.when || (() => true)
      // @ts-ignore
      prompt.when = answers => {
        if (!isManualMode(answers)) return false
        if (typeof originalWhen === 'function') {
          return originalWhen(answers)
        } else if (typeof originalWhen === 'boolean') {
          return originalWhen
        }
      }
    })
    const prompts = [
      this.presetPrompt,
      this.featurePrompt,
      ...this.injectedPrompts,
      ...this.outroPrompts,
    ]
    return prompts
  }

  /**
   * @param {Preset} preset
   */
  async askSavePreset (preset) {
    const prompts = [
      {
        name: 'save',
        type: 'confirm',
        message: 'Save this as a preset for future projects?',
        default: false,
      },
      {
        name: 'saveName',
        when: answers => answers.save,
        type: 'input',
        message: 'Save preset as:',
      },
    ]

    const answers = await inquirer.prompt(prompts)

    if (answers.save && answers.saveName) {
      preset.name = answers.saveName
      const globalOptions = loadGlobalOptions()
      if (!globalOptions.presets) globalOptions.presets = {}
      globalOptions.presets[answers.saveName] = preset
      saveGlobalOptions(globalOptions)
    }
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
        await getPackageTaggedVersion(dep).then(version => version && `^${version}`) ||
        'latest'
      )
    }
    // write package.json
    await this.writeFileToDisk('package.json', JSON.stringify(pkg, null, 2))
  }

  run (command, args) {
    if (!args) { [command, ...args] = command.split(/\s+/) }
    return execa(command, args, { cwd: this.cwd })
  }

  async writeFileToDisk (filename, source) {
    await writeFileTree(this.cwd, {
      [filename]: new MigrationOperationFile(this.cwd, filename, source, true),
    })
  }
}
