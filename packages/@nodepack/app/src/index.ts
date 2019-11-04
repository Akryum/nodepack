import { createContext, callHook } from '@nodepack/app-context'

/**
 * Call this method to bootstrap your application. All plugin hooked into 'bootstrap'
 * will be automatically called, typically setting up connections and servers.
 *
 * @param callback Called when the application bootstrap is complete.
 */
export async function bootstrap (
  callback: ((ctx?: any) => Promise<void> | void) = null,
): Promise<void> {
  try {
    const ctx = await createContext()
    await callHook('bootstrap', ctx)
    if (callback) {
      await callback(ctx)
    }
    return ctx
  } catch (e) {
    console.error(e)
  }
}

/**
 * Print useful information after the application is bootstrapped, like the listening port.
 */
export async function printReady (): Promise<void> {
  await callHook('printReady')
}

/**
 * Closes handles such as open connections and servers.
 */
export async function destroy (): Promise<void> {
  await callHook('destroy')
}
