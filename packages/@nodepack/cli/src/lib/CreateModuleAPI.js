/** @typedef {import('./ProjectCreateJob')} ProjectCreateJob */
/** @typedef {import('inquirer').ChoiceType} ChoiceType */
/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('./ProjectCreateJob').Preset} Preset */

module.exports = class CreateModuleAPI {
  /**
   * @param {ProjectCreateJob} job
   */
  constructor (job) {
    this.job = job
  }

  /**
   * @param {ChoiceType} feature
   */
  injectFeature (feature) {
    this.job.featurePrompt.choices.push(feature)
  }

  /**
   * @param {Question} prompt
   */
  injectPrompt (prompt) {
    this.job.injectedPrompts.push(prompt)
  }

  /**
   * @param {(answers: any, preset: Preset) => void | Promise.<void>} cb
   */
  onPromptComplete (cb) {
    this.job.promptCompleteCbs.push(cb)
  }
}
