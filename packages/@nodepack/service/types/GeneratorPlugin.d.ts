import { ProjectOptions } from './options'
import GeneratorPluginApi from '@nodepack/generator/src/lib/GeneratorPluginAPI.js'

export type GeneratorPlugin = (api: GeneratorPluginApi, options: ProjectOptions) => void
