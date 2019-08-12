const { Hookable } = require('@nodepack/utils')

const hooks = new Hookable()

exports.createContext = async () => {
  const ctx = {}
  await hooks.callHook('create', ctx)
  return ctx
}

exports.hook = hooks.hook
exports.callHook = hooks.callHook
