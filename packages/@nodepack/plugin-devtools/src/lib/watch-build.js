const execa = require('execa')

/**
 * @param {string} folder
 * @returns {Promise}
 */
exports.watchBuild = async (folder) => {
  await execa('nodemon', [
    '--exec', 'yarn run build',
    '-e', 'js,ts,json',
    '-i', 'dist',
  ], {
    cwd: folder,
    preferLocal: true,
    stdio: 'inherit',
  })
}
