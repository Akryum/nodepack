const { Hookable } = require('@nodepack/hookable')

const hooks = new Hookable()

export async function createContext () {
  const ctx = {}
  await hooks.callHook('create', ctx)
  return ctx
}

export const hook = hooks.hook
export const callHook = hooks.callHook
