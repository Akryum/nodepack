const { Hookable } = require('@nodepack/hookable')
const config = require('@nodepack/app-config')

// @ts-ignore
const hooks = global._contextHooks = global._contextHooks || new Hookable()

exports.createContext = async function () {
  const ctx = {
    config,
  }
  await hooks.callHook('create', ctx)
  return ctx
}

exports.hook = hooks.hook
exports.callHook = hooks.callHook
