declare module '@nodepack/app-context' {
  export function createContext (): Promise<any>
  export function hook (name: string, callback: Function): void
  export function callHook (name: string, ...args: any[]): Promise<void>
}
