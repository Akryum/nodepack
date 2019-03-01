exports.DEV_PATH = '.nodepack/temp/output'

/** Supported extension in our webpack config */
exports.SUPPORTED_EXTENSIONS = [
  '.js',
  '.json',
  '.node',
  '.mjs',
  '.ts',
  '.tsx',
]

/** Builtin node modules that should be externals */
exports.NODE_BUILTINS = new Set([
  // @ts-ignore
  ...require('repl')._builtinLibs,
  'constants',
  'module',
  'timers',
  'console',
  '_stream_writable',
  '_stream_readable',
  '_stream_duplex',
])
