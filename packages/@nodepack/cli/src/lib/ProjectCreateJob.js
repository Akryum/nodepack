/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('inquirer').ChoiceType} ChoiceType */
/** @typedef {import('@nodepack/utils').Preset} Preset */
/** @typedef {import('./CreateModuleAPI')} CreateModuleAPI */

/** @typedef {(api: CreateModuleAPI) => void} CreateModule */

// API
const CreateModuleAPI = require('./CreateModuleAPI')
// Utils
const { runMaintenance } = require('@nodepack/maintenance')
const inquirer = require('inquirer')
const cloneDeep = require('lodash.clonedeep')
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
  installDeps,
  defaultPreset,
  getPackageTaggedVersion,
  shouldUseGit,
  commitOnGit,
  run,
} = require('@nodepack/utils')
const { MigrationOperationFile, writeFileTree } = require('@nodepack/app-migrator')
const generateReadme = require('../util/generateReadme')
const { formatFeatures } = require('../util/features')
const { getPresets } = require('../util/getPresets')
const { resolvePreset, getPresetFromAnswers } = require('../util/resolvePreset')

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
  }

  /**
   * @param {any} cliOptions
   * @param {Preset?} preset
   */
  async create (cliOptions = {}, preset = null) {
    const { projectName, cwd } = this

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
      await run(cwd, 'git init')
    }

    await runMaintenance({
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
          const { success } = await commitOnGit(cwd, cliOptions, isTestOrDebug, `[nodepack] create project`)
          gitCommitSuccess = success
        }
        stopSpinner()

        // save preset
        if (this.isPresetManual) {
          await this.askSavePreset(finalPreset)
        }

        // log instructions
        if (!cliOptions.skipGetStarted) {
          log()
          log(`🎉  Successfully created project ${chalk.yellow(projectName)}.`)
          log(
            `👉  Get started with the following commands:\n\n` +
            (cwd === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${projectName}\n`)) +
            chalk.cyan(` ${chalk.gray('$')} nodepack`)
          )
          log()
        }

        if (!gitCommitSuccess) {
          warn(
            `Skipped git commit due to missing username and email in git config.\n` +
            `You will need to perform the initial commit yourself.\n`
          )
        }
      },
    })
  }

  /**
   * @returns {Promise.<Preset>}
   */
  async resolvePresetFromOptions (cliOptions) {
    /** @type {Preset?} */
    let preset = null
    if (cliOptions.preset) {
      // nodepack create foo --preset bar
      preset = await resolvePreset(cliOptions.preset, cliOptions.clone)
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

    const preset = await getPresetFromAnswers(answers, this.promptCompleteCbs)

    // validate
    // TODO

    this.isPresetManual = answers.preset === '__manual__'

    return preset
  }

  resolveIntroPrompts () {
    const presets = getPresets()
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

  async writeFileToDisk (filename, source) {
    await writeFileTree(this.cwd, {
      [filename]: new MigrationOperationFile(this.cwd, filename, source, true),
    })
  }
}
