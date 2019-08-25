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

exports.callHookWithPayload = async (hookName, ctx, payload, ...args) => {
  ctx[hookName] = payload
  await exports.callHook(hookName, ctx, payload, ...args)
  return ctx[hookName]
}
