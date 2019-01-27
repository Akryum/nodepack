/** @type {import('../../types/ServicePlugin').ServicePlugin} */
module.exports = (api, options) => {
  const {
    info,
    done,
    getPkgCommand,
    installPackage,
  } = require('@nodepack/utils')
  const { mayBeNodeModule } = require('@nodepack/module')

  const installModule = async (id, dev = false) => {
    info(`Installing ${id}...`)
    const cwd = api.getCwd()
    await installPackage(
      cwd,
      getPkgCommand(cwd),
      null,
      id,
      dev
    )
    done(`Installed ${id} into the project.`)
  }

  // Auto install babel
  api.diagnoseError({
    filter: error =>
      error.name === 'ModuleParseError' &&
      error.module.resource.match(/\.js$/i) &&
      !api.hasPackage('@nodepack/plugin-babel'),

    suggestion: {
      id: 'auto-install-babel',
      title: `It seems you are using unsupported JS syntax.`,
      description: `Babel is a tool to support newer syntax and proposals.`,
      link: 'https://github.com/Akryum/nodepack/blob/master/packages/%40moonreach/nodepack-plugin-babel',
      question: `Do you want to install Babel nodepack plugin?`,
    },

    handler: async (compiler, stats, error) => {
      await installModule('@nodepack/plugin-babel')
      await api.restart('auto-install-babel')
    },
  })

  // Auto install missing dep
  api.diagnoseError({
    filter: error =>
      error.dependencies &&
      error.dependencies.length > 0 &&
      error.name === 'ModuleNotFoundError' &&
      error.message.indexOf('Module not found') === 0 &&
      mayBeNodeModule(error.dependencies[0].request) &&
      !api.hasPackage(getModuleName(error)),

    suggestion: error => {
      const name = getModuleName(error)
      return {
        id: 'auto-install-missing-dep',
        title: `Module ${name} not found`,
        question: `Install ${name}?`,
      }
    },

    handler: async (compiler, stats, error) => {
      const name = getModuleName(error)
      await installModule(name)
      await api.restart(`auto-install-missing-dep:${name}`)
    },
  })
}

function getModuleName (error) {
  return error.dependencies[0].request
}
