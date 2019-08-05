declare module '@nodepack/app-config' {
  export type Config = {
    [key: string]: any
  }

  const config: Config
  export default config
}
