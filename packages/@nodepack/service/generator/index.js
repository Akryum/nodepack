/** @type {import('@nodepack/service').GeneratorPlugin} */
module.exports = (api, options) => {
  api.render('./templates/default')

  api.extendPackage({
    scripts: {
      'dev': 'nodepack-service dev',
      'build': 'nodepack-service build',
    },
  })
}
