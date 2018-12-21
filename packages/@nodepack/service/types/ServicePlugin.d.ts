import { ProjectOptions } from './ProjectOptions'
import PackPluginApi from '../src/lib/ServicePluginAPI.js'

type ServicePluginApplyBase = (api: PackPluginApi, options: ProjectOptions) => void

export interface ServicePlugin extends ServicePluginApplyBase {
  defaultEnvs?: Object.<string, string>
}
