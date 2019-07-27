const execa = require('execa')
const { resolvePreset, getPresetFromAnswers } = require('@nodepack/cli/src/util/resolvePreset')
const { defaultPreset } = require('@nodepack/utils')

exports.createProject = async function ({
  cwd,
  answers,
  setProgress,
  addLog,
}, promptCompleteCbs) {
  // Config files
  let index
  if ((index = answers.features.indexOf('use-config-files')) !== -1) {
    answers.features.splice(index, 1)
    answers.useConfigFiles = 'files'
  }

  // Preset
  if (answers.presetName) {
    answers.save = true
    answers.saveName = answers.presetName
  }

  setProgress({
    info: 'Resolving preset...',
  })
  let preset
  if (answers.preset === '__remote__' && answers.remotePreset) {
    // vue create foo --preset bar
    preset = await resolvePreset(answers.remotePreset.url, answers.remotePreset.clone)
  } else if (answers.preset === 'default') {
    // vue create foo --default
    preset = defaultPreset
  } else {
    preset = await getPresetFromAnswers(answers, promptCompleteCbs)
  }
  setProgress({
    info: null,
  })

  // Create
  const args = [
    '--skipGetStarted',
  ]
  if (answers.packageManager) args.push('--packageManager', answers.packageManager)
  if (answers.registryUrl) args.push('--registry', answers.registryUrl)
  if (answers.proxy) args.push('--proxy', answers.proxy)
  if (answers.force) args.push('--force')
  // Git
  if (!answers.useGit) {
    args.push('--no-git')
  } else if (answers.commitMessage) {
    args.push('--git', answers.commitMessage)
  }
  // Preset
  args.push('--inlinePreset', JSON.stringify(preset))

  const cmd = execa('nodepack', [
    'create',
    answers.projectName,
    ...args,
  ], {
    cwd,
    stdio: ['inherit', 'pipe', 'inherit'],
  })

  const onData = buffer => {
    const text = buffer.toString().trim()
    if (text) {
      setProgress({
        info: text,
      })
      addLog({
        type: 'info',
        message: text,
      })
    }
  }

  cmd.stdout.on('data', onData)

  await cmd
}
