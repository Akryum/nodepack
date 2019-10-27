import { sequence } from './fn'

export type HookMap = { [key: string]: Function[] }
export type ConfigHooks = { [key: string]: (ConfigHooks | Function) }

export class Hookable {
  _hooks: HookMap
  _deprecatedHooks: {[key: string]: string}

  constructor () {
    this._hooks = {}
    this._deprecatedHooks = {}

    this.hook = this.hook.bind(this)
    this.callHook = this.callHook.bind(this)
  }

  /**
   * Register a callback to a specific hook.
   */
  hook (name: string, fn: Function) {
    if (!name || typeof fn !== 'function') {
      return
    }

    if (this._deprecatedHooks[name]) {
      console.warn(`${name} hook has been deprecated, please use ${this._deprecatedHooks[name]}`)
      name = this._deprecatedHooks[name]
    }

    this._hooks[name] = this._hooks[name] || []
    this._hooks[name].push(fn)
  }

  /**
   * Call all callbacks for a hook. They are called sequentially with async support.
   */
  async callHook (name: string, ...args: any[]) {
    if (!this._hooks[name]) {
      return
    }

    try {
      await sequence(this._hooks[name], fn => fn(...args))
    } catch (err) {
      name !== 'error' && await this.callHook('error', err)
      console.error(err)
      throw err
    }
  }

  /**
   * Remove all callbacks for a specific hook.
   */
  clearHook (name: string) {
    if (name) {
      delete this._hooks[name]
    }
  }

  /**
   * Remove all hooks.
   */
  clearHooks () {
    this._hooks = {}
  }

  /**
   * Add hook callbacks from a hook object. Example:
   * `{ foo: { bar: () => console.log('foo:bar') } }`
   * This will register the `foo:bar` hook callback.
   */
  addHooks (configHooks: ConfigHooks) {
    const hooks = this._flattenHooks(configHooks)
    Object.keys(hooks).forEach((key) => {
      this.hook(key, hooks[key])
    })
  }

  /**
   * Mark a hook as deprecated.
   */
  deprecateHook (oldName: string, newName: string) {
    this._deprecatedHooks[oldName] = newName
  }

  /**
   * @private
   * Flatten an hook object. Example:
   * `{ foo: { bar: () => console.log('foo:bar') } }`
   * This will register the `foo:bar` hook callback.
   */
  _flattenHooks (
    configHooks: ConfigHooks,
    separator: string = ':',
    hooks: { [key: string]: Function } = {},
    parentName: string = null,
  ) {
    Object.keys(configHooks).forEach((key) => {
      const subHook = configHooks[key]
      const name = parentName ? `${parentName}${separator}${key}` : key
      if (typeof subHook === 'object' && subHook !== null) {
        this._flattenHooks(subHook, separator, hooks, name)
      } else if (typeof subHook === 'function') {
        hooks[name] = subHook
      }
    })
    return hooks
  }
}
