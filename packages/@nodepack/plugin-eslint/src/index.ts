import { ServicePluginAPI, ProjectOptions } from '@nodepack/service'
import path from 'path'
import { getExtensions } from './options'
import { resolveModule, loadModule } from '@nodepack/module'
import { lint } from './lint'

export default (api: ServicePluginAPI, options: ProjectOptions) => {
  const extensions = getExtensions(api)
  const cwd = api.getCwd()
  const eslintPkg =
      loadModule('eslint/package.json', cwd, true) ||
      loadModule('eslint/package.json', __dirname, true)

  const cacheIdentifier = api.genCacheConfig(
    'eslint-loader',
    {
      'eslint-loader': require('eslint-loader/package.json').version,
      eslint: eslintPkg.version,
    },
    [
      '.eslintrc.js',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.eslintrc.json',
      '.eslintrc',
      'package.json',
    ],
  )

  api.chainWebpack(webpackConfig => {
    webpackConfig.module
      .rule('eslint')
      .pre()
      .exclude
      .add(/node_modules/)
      .add(path.dirname(resolveModule('@nodepack/service/package.json', cwd)))
      .end()
      .test(/\.(vue|(j|t)sx?)$/)
      .use('eslint-loader')
      .loader(require.resolve('eslint-loader'))
      .options({
        extensions,
        cache: true,
        cacheIdentifier,
        eslintPath: path.dirname(
          resolveModule('eslint/package.json', cwd) ||
              resolveModule('eslint/package.json', __dirname),
        ),
        formatter: loadModule('eslint/lib/formatters/codeframe', cwd, true),
      })
  })

  api.registerCommand(
    'lint',
    {
      description: 'lint and fix source files',
      usage: 'nodepack-service lint [options] [...files]',
      options: {
        '--format [formatter]': 'specify formatter (default: codeframe)',
        '--no-fix': 'do not fix errors or warnings',
        '--no-fix-warnings': 'fix errors, but do not fix warnings',
        '--max-errors [limit]':
          'specify number of errors to make build failed (default: 0)',
        '--max-warnings [limit]':
          'specify number of warnings to make build failed (default: Infinity)',
      },
    },
    args => {
      lint(args, api)
    },
  )
}
