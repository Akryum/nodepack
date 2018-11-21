import { ProjectOptions } from './options'
import GeneratorPluginApi from '@moonreach/nodepack-generator/src/lib/GeneratorPluginAPI.js'

export type GeneratorPluginApply = (api: GeneratorPluginApi, options: ProjectOptions) => void
