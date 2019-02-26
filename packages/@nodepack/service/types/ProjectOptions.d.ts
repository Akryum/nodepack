import Config from 'webpack-chain'

export interface ProjectOptions {
  /** Folder output for prod build */
  outputDir?: string;
  /**
   * Folder containing source.
   * By default will be aliased to `@/`
   * (for example, `@/lib/foo.js` will be resolved as `src/lib/foo.js`).
   */
  srcDir?: string;
  /** Entry file (relative to project root) */
  entry?: string;
  /** Enable sourcemaps in production build (can slow down build) */
  productionSourceMap?: boolean;
  /** Webpack externals packages */
  externals?: any;
  /** Minify production builds */
  minify?: boolean;
  /** Whitelist option for webpack-node-externals */
  nodeExternalsWhitelist?: any;
  /** Modify webpack config with webpack-chain */
  chainWebpack?: (config: Config) => void;
  /** Enable parallel compilation */
  parallel?: boolean;
  /** Force transpile `node_modules` packages with babel */
  transpileDependencies?: Array<string | RegExp>;
  /**
   * Default port for `process.env.PORT` if it is not defined.
   * It will change to a free port automatically if it is not available.
   */
  defaultPort?: number;
  /** Enable file linting as part of the build process */
  lintOnBuild?: boolean;
  /** Options for 3rd-party plugins */
  pluginOptions?: any;
}
