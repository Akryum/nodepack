import { Consola } from 'consola'

// https://github.com/nuxt/consola/pull/80
declare module 'consola' {
  export = new Consola()
}
