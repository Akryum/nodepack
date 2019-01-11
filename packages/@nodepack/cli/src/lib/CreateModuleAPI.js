/** @typedef {import('./ProjectCreator')} Creator */
/** @typedef {import('inquirer').ChoiceType} ChoiceType */
/** @typedef {import('inquirer').Question} Question */
/** @typedef {import('./ProjectCreator').Preset} Preset */

module.exports = class CreateModuleAPI {
  /**
   * @param {Creator} creator
   */
  constructor (creator) {
    this.creator = creator
  }

  /**
   * @param {ChoiceType} feature
   */
  injectFeature (feature) {
    this.creator.featurePrompt.choices.push(feature)
  }

  /**
   * @param {Question} prompt
   */
  injectPrompt (prompt) {
    this.creator.injectedPrompts.push(prompt)
  }

  /**
   * @param {(answers: any, preset: Preset) => void | Promise.<void>} cb
   */
  onPromptComplete (cb) {
    this.creator.promptCompleteCbs.push(cb)
  }
}
