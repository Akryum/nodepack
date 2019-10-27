/** @typedef {import('../lib/Service')} Service */
/** @typedef {import('../lib/Service').Suggestion} Suggestion */
/** @typedef {import('webpack').Compiler} Compiler */
/** @typedef {import('webpack').Stats} Stats */

const ID = 'diagnose-error'

module.exports = class DiagnoseErrorPlugin {
  /**
   * @param {Service} service
   */
  constructor (service) {
    this.service = service
  }

  /**
   * @param {Compiler} compiler
   */
  apply (compiler) {
    compiler.hooks.done.tap(ID, async (stats) => {
      if (stats.hasErrors()) {
        // @ts-ignore
        compiler._nodepackPause = true
        // Process webpack errors
        for (const e of stats.compilation.errors) {
          await this.processError(e, compiler, stats)
        }
        // @ts-ignore
        compiler._nodepackPause = false
      } else {
        // Reset restart
        process.send && process.send({ restart: { reason: null } })
        delete process.env._RESTART_REASON
      }
    })
  }

  /**
   * @param {Compiler} compiler
   * @param {Stats} stats
   */
  async processError (error, compiler, stats) {
    // For development purposes
    if (process.env.DUMP_ERRORS) {
      this.dumpError(error)
    }

    const diagnosers = []
    for (const diagnoser of this.service.errorDiagnosers) {
      try {
        // Diagnoser can match an error
        if (await diagnoser.filter(error)) {
          // Optional suggested fix to be presented to the user
          const suggestionOption = diagnoser.suggestion
          if (suggestionOption != null) {
            /** @type {Suggestion?} */
            let suggestion = null
            if (typeof suggestionOption === 'function') {
              const result = await suggestionOption(error)
              if (result) {
                suggestion = result
              }
            } else {
              suggestion = suggestionOption
            }
            if (suggestion) {
              if (!await this.suggestFix(suggestion)) {
                // The user rejected the suggested fix
                continue
              }
            }
          }

          // Will apply this diagnoser's handler
          diagnosers.push(diagnoser)
        }
      } catch (e) {
        console.log(e)
      }
    }

    // Apply all the selected handlers
    for (const diagnoser of diagnosers) {
      try {
        await diagnoser.handler(compiler, stats, error)
      } catch (e) {
        console.log(e)
      }
    }
  }

  /**
   * @param {Suggestion} suggestion
   * @returns {Promise.<boolean>}
   */
  async suggestFix (suggestion) {
    const { info, chalk, loadGlobalOptions, saveGlobalOptions } = require('@nodepack/utils')
    const inquirer = require('inquirer')

    info(chalk.blue(`Error diagnostic: ${chalk.bold(suggestion.title)}`))

    // Saved user answer to apply or skip automatically
    let { suggestions } = loadGlobalOptions()
    if (suggestions) {
      const settings = suggestions[suggestion.id]
      if (settings) {
        if (settings.alwaysApply) {
          console.log(`${chalk.dim(suggestion.question)} ${chalk.green(`(✔ Applied automatically)`)}`)
        } else {
          console.log(`${chalk.dim(suggestion.question)} ${chalk.yellow(`(❌ Never applied)`)}`)
        }
        return settings.alwaysApply
      }
    } else {
      suggestions = {}
    }

    if (suggestion.description) {
      console.log(chalk.dim(suggestion.description))
    }
    if (suggestion.link) {
      console.log(chalk.dim(`More info: ${suggestion.link}`))
    }

    /**
     * @typedef ApplyFix
     * @prop {boolean} apply
     * @prop {boolean} always
     */
    /**
     * @typedef Answers
     * @prop {ApplyFix} applyFix
     */
    /** @type {Answers} */
    const { applyFix } = await inquirer.prompt([
      {
        name: 'applyFix',
        type: 'list',
        message: `${chalk.reset('Suggested fix:')} ${chalk.bold(suggestion.question)}`,
        choices: [
          {
            name: chalk.green(`✔ Apply this time`),
            /** @type {ApplyFix} */
            value: { apply: true, always: false },
          },
          {
            name: chalk.yellow(`❌ Don't apply this time`),
            /** @type {ApplyFix} */
            value: { apply: false, always: false },
          },
          {
            name: chalk.green(`✔ Apply this time and all the next times`),
            /** @type {ApplyFix} */
            value: { apply: true, always: true },
          },
          {
            name: chalk.yellow(`❌ Don't apply this time and all the next times`),
            /** @type {ApplyFix} */
            value: { apply: false, always: true },
          },
        ],
        validate: input => !!input,
      },
    ])

    // Save user answer if 'always apply' or 'always skip'
    if (applyFix.always) {
      suggestions[suggestion.id] = {
        alwaysApply: applyFix.apply,
      }
      saveGlobalOptions({ suggestions })
    }

    return applyFix.apply
  }

  dumpError (error) {
    console.log(`Error: ${error.message}`)
    for (const key of Object.keys(error)) {
      console.log(` ${key}:`, error[key])
    }
  }
}
