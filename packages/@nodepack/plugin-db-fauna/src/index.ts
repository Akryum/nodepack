import { ServicePluginAPI, ProjectOptions } from '@nodepack/service'
export { default as FaunaContext } from './context'

export default (api: ServicePluginAPI, options: ProjectOptions) => {
  api.addRuntimeModule('./runtime/index.js')
}
