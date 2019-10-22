declare module '@nodepack/module' {
  export function resolveModule (request: string, cwd: string): string | undefined

  export function loadModule (request: string, cwd: string, force: boolean = false): any

  export function clearModule (request: string, cwd: string): void

  export function mayBeNodeModule (module: string): boolean

  export function isRelative (module: string): boolean

  export function isAbsolute (module: string): boolean
}

