/** @type {import('@moonreach/nodepack').GeneratorPluginApply} */
module.exports = (api, options) => {
  api.render('./templates/default')

  api.extendPackage({
    scripts: {
      'dev': 'nodepack dev',
      'build': 'nodepack build',
    },
  })
}
