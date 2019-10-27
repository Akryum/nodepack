import { Hookable } from '@nodepack/hookable'
import config from '@nodepack/app-config'

// @ts-ignore
const hooks: Hookable = global._contextHooks = global._contextHooks || new Hookable()

export async function createContext () : Promise<any> {
  const ctx = {
    config,
  }
  await hooks.callHook('create', ctx)
  return ctx
}

export const hook = hooks.hook
export const callHook = hooks.callHook

export async function callHookWithPayload<T> (
  hookName: string,
  ctx: any,
  payload: T,
  ...args: any[]
): Promise<T> {
  ctx[hookName] = payload
  await callHook(hookName, ctx, payload, ...args)
  return payload
}
