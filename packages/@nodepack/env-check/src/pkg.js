/**
 * @param {string} cwd
 */
exports.printInstalledPackages = async (cwd) => {
  const fs = require('fs-extra')
  const path = require('path')
  const chalk = require('chalk')
  const pkgFile = path.resolve(cwd, 'package.json')
  if (fs.existsSync(pkgFile)) {
    try {
      const pkg = await fs.readJson(pkgFile)
      if (pkg.dependencies) {
        console.log(`dependencies:\n`, JSON.stringify(pkg.dependencies, null, 2))
      }
      if (pkg.devDependencies) {
        console.log(`devDependencies:\n`, JSON.stringify(pkg.devDependencies, null, 2))
      }
    } catch (e) {
      console.log(chalk.red(`Couldn't parse JSON: ${pkgFile}`))
      console.error(e)
    }
  }
}
