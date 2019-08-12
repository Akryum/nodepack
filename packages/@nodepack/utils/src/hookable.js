const { sequence } = require('./fn')
const { warn, error } = require('./logger')

/** @typedef {{ [key: string]: function[] }} HookMap */
/** @typedef {{ [key: string]: (ConfigHooks | function) }} ConfigHooks */

exports.Hookable = class Hookable {
  constructor () {
    /** @type {HookMap} */
    this._hooks = {}
    /** @type {{[key: string]: string}} */
    this._deprecatedHooks = {}

    this.hook = this.hook.bind(this)
    this.callHook = this.callHook.bind(this)
  }

  /**
   * Register a callback to a specific hook.
   * @param {string} name
   * @param {function} fn
   */
  hook (name, fn) {
    if (!name || typeof fn !== 'function') {
      return
    }

    if (this._deprecatedHooks[name]) {
      warn(`${name} hook has been deprecated, please use ${this._deprecatedHooks[name]}`)
      name = this._deprecatedHooks[name]
    }

    this._hooks[name] = this._hooks[name] || []
    this._hooks[name].push(fn)
  }

  /**
   * Call all callbacks for a hook. They are called sequentially with async support.
   * @param {string} name
   * @param {any[]} args
   */
  async callHook (name, ...args) {
    if (!this._hooks[name]) {
      return
    }

    try {
      await sequence(this._hooks[name], fn => fn(...args))
    } catch (err) {
      name !== 'error' && await this.callHook('error', err)
      error(err)
    }
  }

  /**
   * Remove all callbacks for a specific hook.
   * @param {string} name
   */
  clearHook (name) {
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
   * @param {ConfigHooks} configHooks
   */
  addHooks (configHooks) {
    const hooks = this._flattenHooks(configHooks)
    Object.keys(hooks).forEach((key) => {
      this.hook(key, hooks[key])
    })
  }

  /**
   * Mark a hook as deprecated.
   * @param {string} oldName
   * @param {string} newName
   */
  deprecateHook (oldName, newName) {
    this._deprecatedHooks[oldName] = newName
  }

  /**
   * @private
   * Flatten an hook object. Example:
   * `{ foo: { bar: () => console.log('foo:bar') } }`
   * This will register the `foo:bar` hook callback.
   * @param {ConfigHooks} configHooks
   * @param {string} [separator]
   * @param {{[key: string]: function}} [hooks]
   * @param {string} [parentName]
   */
  _flattenHooks (configHooks, separator = ':', hooks = {}, parentName) {
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
