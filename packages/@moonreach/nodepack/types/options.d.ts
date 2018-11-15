import Config from 'webpack-chain'

export interface ProjectOptions {
  /** folder output for prod build */
  outputDir?: string
  /** folder containing source */
  srcDir?: string
  /** entry file */
  entry?: string
  /** enable sourcemaps in production build */
  productionSourceMap?: boolean
  /** webpack externals */
  externals?: any
  /** whitelist option for webpack-node-externals */
  nodeExternalsWhitelist?: any
  /** modify webpack config with webpack-chain */
  chainWebpack?: (config: Config) => void
  /** enable parallel compilation */
  parallel?: boolean
  /** force transpile node_modules packages with babel */
  transpileDependencies?: Array.<string | RegExp>
  /** options for 3rd-party plugins */
  pluginOptions?: any
}
