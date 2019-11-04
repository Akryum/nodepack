const { getPresets } = require('@nodepack/cli/src/util/getPresets')
const { formatFeatures } = require('@nodepack/cli/src/util/features')
const { getPromptModules } = require('@nodepack/cli/src/lib/createModules')
const CreateModuleAPI = require('@nodepack/cli/src/lib/CreateModuleAPI')
const { createProject } = require('./create-project')

module.exports = globalApi => {
  globalApi.addProjectType('nodepack', 'Nodepack', (projectType) => {
    projectType.logo = '/_plugin/@nodepack%2Fguijs-plugin/nodepack.png'
    projectType.description = `Node.js app/server`
    projectType.link = 'https://nodepackjs.com/'

    // Detect nodepack projects
    projectType.filterProject = ({ pkg }) => ({ ...pkg.dependencies, ...pkg.devDependencies })['@nodepack/service']

    // Project creation
    projectType.onCreate(onCreate)
  })
}

async function onCreate ({ wizard }) {
  wizard.extendGeneralStep({
    prompts: [
      {
        name: 'force',
        type: 'confirm',
        message: 'Overwrite target directory if it exists',
      },
      {
        name: 'packageManager',
        type: 'list',
        message: 'Package manager',
        group: 'Dependencies',
        description: 'Use specified npm client when installing dependencies',
        default: null,
        choices: [
          {
            name: 'Use previous',
            value: null,
          },
          {
            name: 'Npm',
            value: 'npm',
          },
          {
            name: 'Yarn',
            value: 'yarn',
          },
          {
            name: 'Pnpm',
            value: 'pnpm',
          },
        ],
        skin: 'buttongroup',
      },
      {
        name: 'registryUrl',
        type: 'input',
        message: 'Registry URL',
        group: 'Dependencies',
        description: 'Use specified npm registry when installing dependencies',
      },
      {
        name: 'proxy',
        type: 'input',
        message: 'Proxy',
        group: 'Dependencies',
        description: 'Use specified proxy when creating project',
      },
      {
        name: 'useGit',
        type: 'confirm',
        message: 'Initialize git repository (recommended)',
        group: 'Git',
        default: true,
      },
      {
        name: 'commitMessage',
        type: 'input',
        message: 'First commit message',
        group: 'Git',
        when: answers => answers.useGit,
      },
    ],
  })

  // Presets
  const presetsData = getPresets()
  wizard.addSelectStep('preset', 'org.vue.views.project-create.tabs.presets.title', {
    icon: 'check_circle',
    description: 'org.vue.views.project-create.tabs.presets.description',
    message: 'org.vue.views.project-create.tabs.presets.message',
    choices: [
      ...Object.keys(presetsData).map(key => {
        const preset = presetsData[key]
        const info = {
          name: key === 'default' ? 'org.vue.views.project-create.tabs.presets.default-preset' : key,
          description: formatFeatures(preset),
          value: key,
          raw: preset,
        }
        return info
      }),
      {
        name: 'org.vue.views.project-create.tabs.presets.manual.name',
        value: '__manual__',
        description: 'org.vue.views.project-create.tabs.presets.manual.description',
      },
      {
        name: 'org.vue.views.project-create.tabs.presets.remote.name',
        value: '__remote__',
        description: 'org.vue.views.project-create.tabs.presets.remote.description',
      },
    ],
  })

  const isManualPreset = answers => answers.preset && answers.preset === '__manual__'

  // Features
  const createModules = getPromptModules()
  const createModuleData = {
    featurePrompt: {
      choices: [],
    },
    injectedPrompts: [],
    promptCompleteCbs: [],
  }
  // @ts-ignore
  const createModuleAPI = new CreateModuleAPI(createModuleData)
  for (const createModule of createModules) {
    await createModule(createModuleAPI)
  }
  wizard.addStep('features', 'org.vue.views.project-create.tabs.features.title', {
    icon: 'device_hub',
    description: 'org.vue.views.project-create.tabs.features.description',
    prompts: createModuleData.featurePrompt.choices.map(
      data => ({
        name: `featureMap.${data.value}`,
        type: 'confirm',
        message: data.name,
        description: data.description,
        link: data.link,
        default: !!data.checked,
      }),
    ),
  }, isManualPreset)

  // Additional configuration
  wizard.addStep('config', 'org.vue.views.project-create.tabs.configuration.title', {
    icon: 'settings_applications',
    prompts: [
      {
        name: 'useConfigFiles',
        type: 'confirm',
        message: 'org.vue.views.project-create.tabs.features.userConfigFiles.name',
        description: 'org.vue.views.project-create.tabs.features.userConfigFiles.description',
      },
      ...createModuleData.injectedPrompts.map(prompt => ({
        ...prompt,
        when: withAnswers(prompt.when, () => ({
          features: getFeatureList(wizard.answers.featureMap),
        })),
        choices: withAnswers(prompt.choices, () => ({
          features: getFeatureList(wizard.answers.featureMap),
        })),
        default: withAnswers(prompt.default, () => ({
          features: getFeatureList(wizard.answers.featureMap),
        })),
      })),
    ],
  }, isManualPreset)

  // Save preset modal
  wizard.addModalStep('savePreset', 'org.vue.views.project-create.tabs.configuration.modal.title', {
    prompts: [
      {
        name: 'presetName',
        type: 'input',
        message: 'org.vue.views.project-create.tabs.configuration.modal.body.title',
        description: 'org.vue.views.project-create.tabs.configuration.modal.body.subtitle',
        validate: value => !!value,
      },
    ],
    canSkip: true,
  }, isManualPreset)

  // Submit
  wizard.onSubmit(options => createProject({
    ...options,
    answers: {
      ...options.answers,
      features: getFeatureList(options.answers.featureMap),
    },
  }, createModuleData.promptCompleteCbs))
}

function getFeatureList (answers) {
  if (answers == null) return []
  return Object.keys(answers).filter(key => answers[key])
}

function withAnswers (option, overrides) {
  if (typeof option === 'function') {
    return (answers) => option({
      ...answers,
      ...overrides(),
    })
  } else {
    return option
  }
}
