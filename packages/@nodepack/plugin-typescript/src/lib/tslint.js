module.exports = function lint (args = {}, api, silent) {
  const cwd = api.resolve('.')
  const fs = require('fs')
  const globby = require('globby')
  const tslint = require('tslint')

  const options = {
    fix: args['fix'] !== false,
    formatter: args.format || 'codeFrame',
    formattersDirectory: args['formatters-dir'],
    rulesDirectory: args['rules-dir'],
  }

  const program = tslint.Linter.createProgram(api.resolve('tsconfig.json'))

  const linter = new tslint.Linter(options, program)

  const tslintConfigPath = api.resolve('tslint.json')

  const config = tslint.Configuration.findConfiguration(tslintConfigPath).results

  const lint = file => {
    const filePath = api.resolve(file)
    linter.lint(
      // append .ts so that tslint apply TS rules
      filePath,
      '',
      config,
    )
  }

  const files = args._ && args._.length
    ? args._
    : ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts', 'tests/**/*.tsx']

  // respect linterOptions.exclude from tslint.json
  if (config && config.linterOptions && config.linterOptions.exclude) {
    // use the raw tslint.json data because config contains absolute paths
    const rawTslintConfig = JSON.parse(fs.readFileSync(tslintConfigPath, 'utf-8'))
    const excludedGlobs = rawTslintConfig.linterOptions.exclude
    excludedGlobs.forEach((g) => files.push('!' + g))
  }

  return globby(files, { cwd }).then(files => {
    files.forEach(lint)
    if (silent) return
    const result = linter.getResult()
    if (!result) {
      console.log(`No result.\n`)
    } else if (result.output.trim()) {
      process.stdout.write(result.output)
    } else if (result.fixes && result.fixes.length) {
      // some formatters do not report fixes.
      const f = new tslint.Formatters.ProseFormatter()
      process.stdout.write(f.format(result.failures, result.fixes))
    } else if (!result.failures.length) {
      console.log(`No lint errors found.\n`)
    }

    if (result.failures.length && !args.force) {
      process.exitCode = 1
    }
  })
}
