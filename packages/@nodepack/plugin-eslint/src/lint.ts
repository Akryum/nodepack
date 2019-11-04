import { ServicePluginAPI } from '@nodepack/service'
import { loadModule } from '@nodepack/module'
import { chalk, log, done } from '@nodepack/utils'
import { getExtensions } from './options'
import fs from 'fs'
import path from 'path'
import globby from 'globby'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CLIEngine } from 'eslint'
import { normalizeConfig } from './util'

export function lint (args: any, api: ServicePluginAPI) {
  const cwd = api.getCwd()
  const extensions = getExtensions(api)
  const argsConfig = normalizeConfig(args)
  const config = Object.assign({
    extensions,
    fix: true,
    cwd,
  }, argsConfig)

  const noFixWarnings = (argsConfig.fixWarnings === false)
  const noFixWarningsPredicate = (lintResult) => lintResult.severity === 2
  config.fix = config.fix && (noFixWarnings ? noFixWarningsPredicate : true)

  if (!fs.existsSync(api.resolve('.eslintignore')) && !config.ignorePattern) {
    // .eslintrc.js files (ignored by default)
    // However, we need to lint & fix them so as to make the default generated project's
    // code style consistent with user's selected eslint config.
    // Though, if users provided their own `.eslintignore` file, we don't want to
    // add our own customized ignore pattern here (in eslint, ignorePattern is
    // an addition to eslintignore, i.e. it can't be overridden by user),
    // following the principle of least astonishment.
    config.ignorePattern = [
      '!.*.js',
      '!{src,tests}/**/.*.js',
    ]
  }

  // Try to load local eslint for instant prototyping (global context)
  const { CLIEngine } = loadModule('eslint', cwd, true) || require('eslint')

  const engine: CLIEngine = new CLIEngine(config)

  const defaultFilesToLint = [
    'src',
    'tests',
    // root config files
    '*.js',
    '.*.js',
  ]
    .filter(pattern =>
      globby
        .sync(pattern, { cwd, absolute: true })
        .some(p => !engine.isPathIgnored(p)),
    )

  const files = args._ && args._.length
    ? args._
    : defaultFilesToLint

  // mock process.cwd before executing
  // See:
  // https://github.com/vuejs/vue-cli/issues/2554
  // https://github.com/benmosher/eslint-plugin-import/issues/602
  // https://github.com/eslint/eslint/issues/11218
  const processCwd = process.cwd
  process.cwd = () => cwd
  const report = engine.executeOnFiles(files)
  process.cwd = processCwd

  const formatter = engine.getFormatter(args.format || 'codeframe')

  if (config.fix) {
    CLIEngine.outputFixes(report)
  }

  const maxErrors = argsConfig.maxErrors || 0
  const maxWarnings = typeof argsConfig.maxWarnings === 'number' ? argsConfig.maxWarnings : Infinity
  const isErrorsExceeded = report.errorCount > maxErrors
  const isWarningsExceeded = report.warningCount > maxWarnings

  if (!isErrorsExceeded && !isWarningsExceeded) {
    if (!args.silent) {
      const hasFixed = report.results.some(f => f.output)
      if (hasFixed) {
        log(`The following files have been auto-fixed:`)
        log()
        report.results.forEach(f => {
          if (f.output) {
            log(`  ${chalk.blue(path.relative(cwd, f.filePath))}`)
          }
        })
        log()
      }
      if (report.warningCount || report.errorCount) {
        console.log(formatter(report.results))
      } else {
        done(hasFixed ? `All lint errors auto-fixed.` : `No lint errors found!`)
      }
    }
  } else {
    console.log(formatter(report.results))
    if (isErrorsExceeded && typeof argsConfig.maxErrors === 'number') {
      log(`Eslint found too many errors (maximum: ${argsConfig.maxErrors}).`)
    }
    if (isWarningsExceeded) {
      log(`Eslint found too many warnings (maximum: ${argsConfig.maxWarnings}).`)
    }
    process.exit(1)
  }
}
