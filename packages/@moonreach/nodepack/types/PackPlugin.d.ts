import { ProjectOptions } from './options'
import PackPluginApi from '../src/lib/PackPluginAPI.js'

type PackPluginApplyBase = (api: PackPluginApi, options: ProjectOptions) => void

export interface PackPluginApply extends PackPluginApplyBase {
  defaultEnvs?: Object.<string, string>
}
