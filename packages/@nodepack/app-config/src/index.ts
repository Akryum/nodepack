import { loadFragment } from '@nodepack/fragment'

export type Config = {
  [key: string]: any
}

const config: Config = loadFragment('config.js')

export default config
