# [0.4.16](https://github.com/Akryum/nodepack/compare/v0.4.15...v0.4.16) (2019-10-01)

## plugin-apollo

#### Bug Fixes

* **types:** missing subscriptionsPath on ApolloConfig ([77481f5](https://github.com/Akryum/nodepack/commit/77481f5))



# [0.4.15](https://github.com/Akryum/nodepack/compare/v0.4.14...v0.4.15) (2019-10-01)

## plugin-apollo

#### Features

* **apollo:** support defining paths ([11bb48f](https://github.com/Akryum/nodepack/commit/11bb48f))



# [0.4.14](https://github.com/Akryum/nodepack/compare/v0.4.13...v0.4.14) (2019-10-01)

## maintenance

#### Bug Fixes

* **maintenance:** missing --no-preInstall arg ([1076de4](https://github.com/Akryum/nodepack/commit/1076de4))



# [0.4.13](https://github.com/Akryum/nodepack/compare/v0.4.12...v0.4.13) (2019-10-01)

## service

#### Bug Fixes

* **dev command:** failed terminating app ([e49721a](https://github.com/Akryum/nodepack/commit/e49721a))



# [0.4.12](https://github.com/Akryum/nodepack/compare/v0.4.11...v0.4.12) (2019-09-30)

## app

#### Bug Fixes

* catch errors in app bootstrap ([43d547a](https://github.com/Akryum/nodepack/commit/43d547a))



# [0.4.11](https://github.com/Akryum/nodepack/compare/v0.4.10...v0.4.11) (2019-09-30)

## service

#### Bug Fixes

* **execa:** use preferLocal ([8b74d92](https://github.com/Akryum/nodepack/commit/8b74d92))



# [0.4.10](https://github.com/Akryum/nodepack/compare/v0.4.9...v0.4.10) (2019-09-30)

## cli

#### Bug Fixes

* nodepack xxxx command not finding local bins ([f118592](https://github.com/Akryum/nodepack/commit/f118592))

## service

#### Bug Fixes

* prevent reload loops by excluding additional folders from watch ([fcbb8d4](https://github.com/Akryum/nodepack/commit/fcbb8d4))



# [0.4.9](https://github.com/Akryum/nodepack/compare/v0.4.8...v0.4.9) (2019-09-30)

## utils

#### Bug Fixes

* remove custom yarn progress bar ([f8e13dc](https://github.com/Akryum/nodepack/commit/f8e13dc))



# [0.4.8](https://github.com/Akryum/nodepack/compare/v0.4.7...v0.4.8) (2019-09-30)

## utils

#### Bug Fixes

* shouldn't init git if already in git repository ([6680bea](https://github.com/Akryum/nodepack/commit/6680bea))



# [0.4.7](https://github.com/Akryum/nodepack/compare/v0.4.6...v0.4.7) (2019-08-27)

## app-context

#### Features

* callHookWithPayload ([81a6a29](https://github.com/Akryum/nodepack/commit/81a6a29))

## app-migrator

#### Bug Fixes

* don't render `.ejs` files in a migration operation ([1619ffd](https://github.com/Akryum/nodepack/commit/1619ffd))

## cli

#### Features

* passport create module ([d573995](https://github.com/Akryum/nodepack/commit/d573995))

## plugin-express

#### Features

* Express EJS templates/views ([c022866](https://github.com/Akryum/nodepack/commit/c022866))

## plugin-passport

#### Features

* passport plugin ([d7a9cb9](https://github.com/Akryum/nodepack/commit/d7a9cb9))

## utils

#### Bug Fixes

* update official plugins list ([14ce0ca](https://github.com/Akryum/nodepack/commit/14ce0ca))



# [0.4.6](https://github.com/Akryum/nodepack/compare/v0.4.5...v0.4.6) (2019-08-23)

## cli

#### Bug Fixes

* **project create:** unselected features still being included ([2e36dd3](https://github.com/Akryum/nodepack/commit/2e36dd3))

## maintenance

#### Bug Fixes

* **fragments build:** better output errors ([24428b7](https://github.com/Akryum/nodepack/commit/24428b7))

## plugin-db-knex

#### Bug Fixes

* **template:** comment unused import to prevent error ([e89408d](https://github.com/Akryum/nodepack/commit/e89408d))
#### Features

* warning icon ([6cd4edd](https://github.com/Akryum/nodepack/commit/6cd4edd))

## plugin-db-sequelize

#### Features

* **plugin:** db sequelize plugin ([ed8b0cf](https://github.com/Akryum/nodepack/commit/ed8b0cf))

## service

#### Bug Fixes

* **build:** NODEPACK_RAW_STATS should output even if no errors ([92c16c6](https://github.com/Akryum/nodepack/commit/92c16c6))
* **dev:** NODEPACK_RAW_STATS should also output stats if there are no errors ([f5c786b](https://github.com/Akryum/nodepack/commit/f5c786b))
* **watch:** ignore .nodepack folder ([ad4ca48](https://github.com/Akryum/nodepack/commit/ad4ca48))
#### Features

* **config:** put non-default exports on the config object ([24e5284](https://github.com/Akryum/nodepack/commit/24e5284))

## utils

#### Bug Fixes

* **terminated:** chmod terminate.sh before run ([5bbbee4](https://github.com/Akryum/nodepack/commit/5bbbee4))



# [0.4.5](https://github.com/Akryum/nodepack/compare/v0.4.4...v0.4.5) (2019-08-23)

## db-migrator

#### Features

* db migrations ([4b76719](https://github.com/Akryum/nodepack/commit/4b76719))

## maintenance

#### Features

* **env migration:** context passed as argument ([9eefdc9](https://github.com/Akryum/nodepack/commit/9eefdc9))

## plugin-apollo

#### Bug Fixes

* use forked mock-express-response ([7a8cb93](https://github.com/Akryum/nodepack/commit/7a8cb93))

## plugin-db-knex

#### Features

* add more db drivers in deps ([c16b3e1](https://github.com/Akryum/nodepack/commit/c16b3e1))
* plugin db-knex ([9da77d0](https://github.com/Akryum/nodepack/commit/9da77d0))

## service

#### Features

* **dev:** debounce app restart ([85be3f7](https://github.com/Akryum/nodepack/commit/85be3f7))
* **env:** process.env.NODEPACK_ROOT which define the project root path ([0208c32](https://github.com/Akryum/nodepack/commit/0208c32))

## utils

#### Bug Fixes

* add apollo as official plugin ([3d23c2e](https://github.com/Akryum/nodepack/commit/3d23c2e))



# [0.4.4](https://github.com/Akryum/nodepack/compare/v0.4.3...v0.4.4) (2019-08-19)

## app

#### Features

* **app:** printReady method ([69e2e4b](https://github.com/Akryum/nodepack/commit/69e2e4b))

## plugin-apollo

#### Features

* apollo server plugin ([1adc07a](https://github.com/Akryum/nodepack/commit/1adc07a))



# [0.4.3](https://github.com/Akryum/nodepack/compare/v0.4.2...v0.4.3) (2019-08-19)

## app

#### Bug Fixes

* **bootstrap:** improved types + optional callback ([7e38727](https://github.com/Akryum/nodepack/commit/7e38727))

## config-transformer

#### Bug Fixes

* extendJSConfig errors ([d276d36](https://github.com/Akryum/nodepack/commit/d276d36))

## test-utils

#### Bug Fixes

* type errors ([07f65de](https://github.com/Akryum/nodepack/commit/07f65de))

## utils

#### Bug Fixes

* type errors ([666437d](https://github.com/Akryum/nodepack/commit/666437d))



# [0.4.2](https://github.com/Akryum/nodepack/compare/v0.4.1...v0.4.2) (2019-08-19)

## app

#### Features

* app bootstrap ([6eac992](https://github.com/Akryum/nodepack/commit/6eac992))
* bootstrap now creates a context ([517eaa7](https://github.com/Akryum/nodepack/commit/517eaa7))

## app-migrator

#### Bug Fixes

* hasPlugin ([9433614](https://github.com/Akryum/nodepack/commit/9433614))
#### Features

* add hasPlugin ([5a7680d](https://github.com/Akryum/nodepack/commit/5a7680d))

## cli

#### Features

* **project create:** express feature ([d0a2e82](https://github.com/Akryum/nodepack/commit/d0a2e82))

## fragment

#### Bug Fixes

* **types:** exported members ([ac3d944](https://github.com/Akryum/nodepack/commit/ac3d944))

## plugin-express

#### Features

* express plugin ([ebb6127](https://github.com/Akryum/nodepack/commit/ebb6127))

## service

#### Bug Fixes

* revert runtime module ejs support ([ed3df96](https://github.com/Akryum/nodepack/commit/ed3df96))
* **config:** don't require config folder ([f10aa85](https://github.com/Akryum/nodepack/commit/f10aa85))
* version ([3d2f9a0](https://github.com/Akryum/nodepack/commit/3d2f9a0))

## utils

#### Features

* resolve short official plugins ([22ca74c](https://github.com/Akryum/nodepack/commit/22ca74c))



# [0.4.1](https://github.com/Akryum/nodepack/compare/v0.4.0...v0.4.1) (2019-08-17)

## plugin-typescript

#### Bug Fixes

* remove runtime module example ([1b57628](https://github.com/Akryum/nodepack/commit/1b57628))



# [0.4.0](https://github.com/Akryum/nodepack/compare/v0.3.2...v0.4.0) (2019-08-17)

## app-config

#### Bug Fixes

* remove unused dependency ([72b2e49](https://github.com/Akryum/nodepack/commit/72b2e49))

## app-context

#### Features

* app-context ([38bc632](https://github.com/Akryum/nodepack/commit/38bc632))

## maintenance

#### Bug Fixes

* use info ([31fd538](https://github.com/Akryum/nodepack/commit/31fd538))

## module

#### Bug Fixes

* don't throw if module is null ([9a8d2fb](https://github.com/Akryum/nodepack/commit/9a8d2fb))

## plugin-typescript

#### Bug Fixes

* suppress ts checker info messages ([18cc1aa](https://github.com/Akryum/nodepack/commit/18cc1aa))

## service

#### Bug Fixes

* build runtime before service command ([b27b813](https://github.com/Akryum/nodepack/commit/b27b813))
* delete NODEPACK_ENTRIES ([f1bbb0e](https://github.com/Akryum/nodepack/commit/f1bbb0e))
* don't build config for inspect command ([6a3c2b7](https://github.com/Akryum/nodepack/commit/6a3c2b7))
* ejs runtime modules ([b28f5aa](https://github.com/Akryum/nodepack/commit/b28f5aa))
* ensure config folder exists ([2f147b8](https://github.com/Akryum/nodepack/commit/2f147b8))
* improved messages ([afa0af6](https://github.com/Akryum/nodepack/commit/afa0af6))
* node externals in monorepos ([2619773](https://github.com/Akryum/nodepack/commit/2619773))
* set NODEPACK_DIRNAME in service too ([2cf5ecc](https://github.com/Akryum/nodepack/commit/2cf5ecc))
* use [@nuxt](https://github.com/nuxt)/friendly-error-webpack-plugin ([fe95e0c](https://github.com/Akryum/nodepack/commit/fe95e0c))
* use context outside of app ([5d5ccbd](https://github.com/Akryum/nodepack/commit/5d5ccbd))
#### Features

* addRuntimeModule ([c7dcbe1](https://github.com/Akryum/nodepack/commit/c7dcbe1))
* build config before command ([aed3760](https://github.com/Akryum/nodepack/commit/aed3760))
* NODEPACK_ENTRIES ([7b5abcb](https://github.com/Akryum/nodepack/commit/7b5abcb))
* NODEPACK_RAW_STATS ([0631964](https://github.com/Akryum/nodepack/commit/0631964))
* webpack 5+fragments+runtime plugins+context ([7cd3d0e](https://github.com/Akryum/nodepack/commit/7cd3d0e))



# [0.3.2](https://github.com/Akryum/nodepack/compare/v0.3.1...v0.3.2) (2019-08-05)

## app-config

#### Features

* config system ([5444c46](https://github.com/Akryum/nodepack/commit/5444c46))

## app-migrator

#### Bug Fixes

* **app migration:** improve error handling ([49556d2](https://github.com/Akryum/nodepack/commit/49556d2))



# [0.3.1](https://github.com/Akryum/nodepack/compare/v0.3.0...v0.3.1) (2019-07-28)

## env-migrator

#### Features

* env migrations ([b8cec2c](https://github.com/Akryum/nodepack/commit/b8cec2c))

## guijs-plugin

#### Features

* **guijs:** project type description & link ([e9fb566](https://github.com/Akryum/nodepack/commit/e9fb566))

## service

#### Bug Fixes

* **service:** zombie process if app terminates itself and user kills dev command ([bb5c281](https://github.com/Akryum/nodepack/commit/bb5c281))



# [0.3.0](https://github.com/Akryum/nodepack/compare/v0.2.0...v0.3.0) (2019-07-27)

## service

#### Features

* guijs plugin & refactor to `defaultTemplate` ([655e265](https://github.com/Akryum/nodepack/commit/655e265))

## utils

#### Bug Fixes

* **deps:** reject an error instead of a string ([400ebed](https://github.com/Akryum/nodepack/commit/400ebed))



# [0.2.0](https://github.com/Akryum/nodepack/compare/v0.1.20...v0.2.0) (2019-07-06)

## docs

#### Features

* new NODEPACK_NO_MAINTENANCE env var ([b1ba4ff](https://github.com/Akryum/nodepack/commit/b1ba4ff))

## utils

#### Features

* new openInEditor util ([12bf219](https://github.com/Akryum/nodepack/commit/12bf219))



# [0.1.20](https://github.com/Akryum/nodepack/compare/v0.1.19...v0.1.20) (2019-07-02)

## module

#### Bug Fixes

* support using native Node require ([c2a92a8](https://github.com/Akryum/nodepack/commit/c2a92a8))



# [0.1.19](https://github.com/Akryum/nodepack/compare/v0.1.18...v0.1.19) (2019-07-02)

## utils

#### Bug Fixes

* **globalOptions:** load ([933615c](https://github.com/Akryum/nodepack/commit/933615c))



# [0.1.18](https://github.com/Akryum/nodepack/compare/v0.1.17...v0.1.18) (2019-06-30)

## utils

#### Features

* **utils:** improved globalOptions and rcPath ([cd7a456](https://github.com/Akryum/nodepack/commit/cd7a456))



# [0.1.17](https://github.com/Akryum/nodepack/compare/v0.1.16...v0.1.17) (2019-05-27)

## utils

#### Bug Fixes

* wrong env var name ([a68728f](https://github.com/Akryum/nodepack/commit/a68728f))



# [0.1.16](https://github.com/Akryum/nodepack/compare/v0.1.15...v0.1.16) (2019-04-18)

## service

#### Bug Fixes

* **env:** remove duplicated JSON.stringify ([b9b509e](https://github.com/Akryum/nodepack/commit/b9b509e))



# [0.1.15](https://github.com/Akryum/nodepack/compare/v0.1.14...v0.1.15) (2019-04-18)

## cli

#### Features

* **cli:** nodepack inspect shortcut ([9a684a8](https://github.com/Akryum/nodepack/commit/9a684a8))

## service

#### Bug Fixes

* **build:** don't override output target with dev one if NODE_ENV isn't production ([b682556](https://github.com/Akryum/nodepack/commit/b682556))
* **env:** define NODE_ENV ([9ba561e](https://github.com/Akryum/nodepack/commit/9ba561e))
* **env:** duplicate entries without process.env ([41fdab4](https://github.com/Akryum/nodepack/commit/41fdab4))
#### Features

* **inspect:** syntax highlighting ([717f1c5](https://github.com/Akryum/nodepack/commit/717f1c5))
* display env mode ([f5fb477](https://github.com/Akryum/nodepack/commit/f5fb477))
* **build:** NODE_ENV not 'production' warning ([d427f7c](https://github.com/Akryum/nodepack/commit/d427f7c))
* **env:** define NODEPACK_ENV ([ead7c46](https://github.com/Akryum/nodepack/commit/ead7c46))



# [0.1.14](https://github.com/Akryum/nodepack/compare/v0.1.13...v0.1.14) (2019-03-12)

## app-migrator

#### Bug Fixes

* types errors ([3f7b215](https://github.com/Akryum/nodepack/commit/3f7b215))



# [0.1.13](https://github.com/Akryum/nodepack/compare/v0.1.12...v0.1.13) (2019-03-12)

## docs

#### Features

* **dev:** dbg argument for easier node inspecting ([2898f41](https://github.com/Akryum/nodepack/commit/2898f41))

## service

#### Bug Fixes

* **dev:** processes not killed correctly ([7fae7ed](https://github.com/Akryum/nodepack/commit/7fae7ed))



# [0.1.12](https://github.com/Akryum/nodepack/compare/v0.1.11...v0.1.12) (2019-03-02)

## service

#### Features

* **dev:** source map in stack traces ([786f3cb](https://github.com/Akryum/nodepack/commit/786f3cb))



# [0.1.11](https://github.com/Akryum/nodepack/compare/v0.1.10...v0.1.11) (2019-03-02)

## plugin-typescript

#### Bug Fixes

* **app migration:** tweak tsconfig & tslint ([ccf4bdf](https://github.com/Akryum/nodepack/commit/ccf4bdf))

## service

#### Bug Fixes

* install [@typers](https://github.com/typers)/webpack-env ([c5f3d97](https://github.com/Akryum/nodepack/commit/c5f3d97))



# [0.1.10](https://github.com/Akryum/nodepack/compare/v0.1.9...v0.1.10) (2019-03-01)

## service

#### Bug Fixes

* compatibility with binaries and assets ([8864331](https://github.com/Akryum/nodepack/commit/8864331))
* **webpack:** override mainFields to ['main'] ([72bb880](https://github.com/Akryum/nodepack/commit/72bb880))
#### Features

* **webpack:** better external support ([f756182](https://github.com/Akryum/nodepack/commit/f756182))



# [0.1.9](https://github.com/Akryum/nodepack/compare/v0.1.8...v0.1.9) (2019-03-01)

## service

#### Bug Fixes

* **build:** wrong process exit code on error ([82534b5](https://github.com/Akryum/nodepack/commit/82534b5))



# [0.1.8](https://github.com/Akryum/nodepack/compare/v0.1.7...v0.1.8) (2019-02-26)

## config-transformer

#### Bug Fixes

* **config-transformer:** revert recast ([c04f850](https://github.com/Akryum/nodepack/commit/c04f850))



# [0.1.7](https://github.com/Akryum/nodepack/compare/v0.1.6...v0.1.7) (2019-02-26)

## service

#### Bug Fixes

* **service:** tweak node polyfills ([1e28e43](https://github.com/Akryum/nodepack/commit/1e28e43))



# [0.1.6](https://github.com/Akryum/nodepack/compare/v0.1.5...v0.1.6) (2019-02-26)

## service

#### Features

* **service:** use asset-relocator-loader ([2473a78](https://github.com/Akryum/nodepack/commit/2473a78))



# [0.1.5](https://github.com/Akryum/nodepack/compare/v0.1.4...v0.1.5) (2019-02-26)

## service

#### Bug Fixes

* **service:** mjs error in node_modules ([d921c85](https://github.com/Akryum/nodepack/commit/d921c85))
* **service:** typings ([0da9dbc](https://github.com/Akryum/nodepack/commit/0da9dbc))
#### Features

* **service:** projectOptions.defineEnv ([92762ee](https://github.com/Akryum/nodepack/commit/92762ee))



# [0.1.4](https://github.com/Akryum/nodepack/compare/v0.1.3...v0.1.4) (2019-02-25)

## service

#### Features

* **service:** dev: wait for port to be freed after killing previous app process ([c619147](https://github.com/Akryum/nodepack/commit/c619147))



# [0.1.3](https://github.com/Akryum/nodepack/compare/v0.1.2...v0.1.3) (2019-02-22)

## cli

#### Bug Fixes

* **cli:** don't put console colors in after upgrade plugins git commit ([48dd312](https://github.com/Akryum/nodepack/commit/48dd312))



# [0.1.2](https://github.com/Akryum/nodepack/compare/v0.1.1...v0.1.2) (2019-02-22)

## cli

#### Bug Fixes

* **cli:** don't use cleanup ([ad200c7](https://github.com/Akryum/nodepack/commit/ad200c7))
* **cli:** kill child command and all children ([3c97c4d](https://github.com/Akryum/nodepack/commit/3c97c4d))

## service

#### Bug Fixes

* **service:** dev: improved reload process management ([d41b3c1](https://github.com/Akryum/nodepack/commit/d41b3c1))



# [0.1.1](https://github.com/Akryum/nodepack/compare/v0.1.0...v0.1.1) (2019-02-22)

## service

#### Bug Fixes

* **service:** dev: terminate app on sigkill ([d4d543e](https://github.com/Akryum/nodepack/commit/d4d543e))



# 0.1.0 (2019-02-22)

## other

#### Bug Fixes

* **app migrator:** missing param for extendPackage ([55bbe10](https://github.com/Akryum/nodepack/commit/55bbe10))
* **app migrator:** plugin file loading ([b266b9c](https://github.com/Akryum/nodepack/commit/b266b9c))
* **babel:** babel config log notice ([77683dc](https://github.com/Akryum/nodepack/commit/77683dc))
* **babel:** wrong preset name ([c3af5c6](https://github.com/Akryum/nodepack/commit/c3af5c6))
* **build:** don't clear console ([ff786bf](https://github.com/Akryum/nodepack/commit/ff786bf))
* **build:** don't split vendors ([d83d80a](https://github.com/Akryum/nodepack/commit/d83d80a))
* **cli:** also auto select [@nodepack](https://github.com/nodepack)/service ([1656d19](https://github.com/Akryum/nodepack/commit/1656d19))
* **cli:** also checks for [@nodepack](https://github.com/nodepack)/service in package.json ([67e38c1](https://github.com/Akryum/nodepack/commit/67e38c1))
* **cli:** build command ([51041e5](https://github.com/Akryum/nodepack/commit/51041e5))
* **cli:** duplicated version number with --version ([91f9837](https://github.com/Akryum/nodepack/commit/91f9837))
* **cli:** empty choices for manual upgrade selection ([249700e](https://github.com/Akryum/nodepack/commit/249700e))
* **cli:** git commit error ([868442a](https://github.com/Akryum/nodepack/commit/868442a))
* **cli:** missing create --clone option ([69c93d7](https://github.com/Akryum/nodepack/commit/69c93d7))
* **cli:** plugin add error ([f373447](https://github.com/Akryum/nodepack/commit/f373447))
* **cli:** remove job: pkg should be red again after rollbacks in case it was modified ([4145b42](https://github.com/Akryum/nodepack/commit/4145b42))
* **cli:** typo ([be355ec](https://github.com/Akryum/nodepack/commit/be355ec))
* **cli:** update wording to upgrade ([b65c3f1](https://github.com/Akryum/nodepack/commit/b65c3f1))
* **cli:** upgrade error ([d068ca4](https://github.com/Akryum/nodepack/commit/d068ca4))
* **cli:** upgrade without args ([c153a44](https://github.com/Akryum/nodepack/commit/c153a44))
* **cli:** use updatePackage instead of installDeps ([5c67f6d](https://github.com/Akryum/nodepack/commit/5c67f6d))
* **cli add:** forceInstall param ([bad6210](https://github.com/Akryum/nodepack/commit/bad6210))
* **cli add:** git parameters description ([a99dced](https://github.com/Akryum/nodepack/commit/a99dced))
* **creator:** selecting a preset other than manual crashes ([4a264dc](https://github.com/Akryum/nodepack/commit/4a264dc))
* **dev:** don't exit on build error ([55213cd](https://github.com/Akryum/nodepack/commit/55213cd))
* **dev:** force externals ([9b4f323](https://github.com/Akryum/nodepack/commit/9b4f323))
* **error diag:** specific restart reason for each missing dep ([baf0f5c](https://github.com/Akryum/nodepack/commit/baf0f5c))
* **eslint:** errors ([ef015be](https://github.com/Akryum/nodepack/commit/ef015be))
* **generator:** plugin apply type import ([444b427](https://github.com/Akryum/nodepack/commit/444b427))
* **maintenance:** git commits ([3078b62](https://github.com/Akryum/nodepack/commit/3078b62))
* **maintenance:** install additional deps ([55cfe14](https://github.com/Akryum/nodepack/commit/55cfe14))
* **maintenance:** missing arg ([33a4911](https://github.com/Akryum/nodepack/commit/33a4911))
* **maintenance:** should commit ([3b29596](https://github.com/Akryum/nodepack/commit/3b29596))
* **service:** command usage help ([232090f](https://github.com/Akryum/nodepack/commit/232090f))
* **service:** dev output in .nodepack/temp ([8c2dd71](https://github.com/Akryum/nodepack/commit/8c2dd71))
* **service:** dev: better process kill on reload ([bea6bc7](https://github.com/Akryum/nodepack/commit/bea6bc7))
* **service:** don't minify by default ([1856378](https://github.com/Akryum/nodepack/commit/1856378))
* App migration types ([e2a8741](https://github.com/Akryum/nodepack/commit/e2a8741))
* **service:** don't replace value of process.env.NODE_ENV ([d9f061a](https://github.com/Akryum/nodepack/commit/d9f061a))
* **service:** help command ([533e2b0](https://github.com/Akryum/nodepack/commit/533e2b0))
* **service:** improved terser options for compatibility ([19e9571](https://github.com/Akryum/nodepack/commit/19e9571))
* **utils:** getPackageTaggedVersion missing return ([f475fe1](https://github.com/Akryum/nodepack/commit/f475fe1))
* **utils:** logger tag text color ([e52a118](https://github.com/Akryum/nodepack/commit/e52a118))
* **webpack:** don't overwrite entire process.env ([390995f](https://github.com/Akryum/nodepack/commit/390995f))
* auto debug mode ([8ae2b19](https://github.com/Akryum/nodepack/commit/8ae2b19))
* git URL ([d49bc39](https://github.com/Akryum/nodepack/commit/d49bc39))
* improved git auto commit ([00a598d](https://github.com/Akryum/nodepack/commit/00a598d))
* packages/test folder ([d689a22](https://github.com/Akryum/nodepack/commit/d689a22))
* removed unused imports ([d44c7a1](https://github.com/Akryum/nodepack/commit/d44c7a1))
#### Features

* add plugin ([984244f](https://github.com/Akryum/nodepack/commit/984244f))
* babel, error diagnostics, typings ([12093c6](https://github.com/Akryum/nodepack/commit/12093c6))
* basic mvp with dev and build ([3bb5886](https://github.com/Akryum/nodepack/commit/3bb5886))
* code splitting and default vendor chunk ([99dba92](https://github.com/Akryum/nodepack/commit/99dba92))
* improved logs ([058b5e7](https://github.com/Akryum/nodepack/commit/058b5e7))
* nodepack-cli & nodepack-generator ([9c51cad](https://github.com/Akryum/nodepack/commit/9c51cad))
* preset support ([4efa7c0](https://github.com/Akryum/nodepack/commit/4efa7c0))
* **api:** async chainWebpack ([29e77b8](https://github.com/Akryum/nodepack/commit/29e77b8))
* **app migrator:** check if answers are serializable to JSON ([a2d53d5](https://github.com/Akryum/nodepack/commit/a2d53d5))
* **app migrator:** rollback API ([66072ef](https://github.com/Akryum/nodepack/commit/66072ef))
* **app migrator:** specify which plugin is prompting ([2396853](https://github.com/Akryum/nodepack/commit/2396853))
* **build:** clean dist folder ([e3375eb](https://github.com/Akryum/nodepack/commit/e3375eb))
* **build:** file stats ([1c72088](https://github.com/Akryum/nodepack/commit/1c72088))
* **build:** function arg ([2f76cfb](https://github.com/Akryum/nodepack/commit/2f76cfb))
* **build:** simpolify file stats ([c3f1e6a](https://github.com/Akryum/nodepack/commit/c3f1e6a))
* **cli:** available upgrades summary ([89af49e](https://github.com/Akryum/nodepack/commit/89af49e))
* **cli:** build command ([bc0e06d](https://github.com/Akryum/nodepack/commit/bc0e06d))
* **cli:** check is in project for relevant commands ([c119ba6](https://github.com/Akryum/nodepack/commit/c119ba6))
* **cli:** create modules, preset/feature selection ([c8ebcb7](https://github.com/Akryum/nodepack/commit/c8ebcb7))
* **cli:** dev project setup ([cfd9c77](https://github.com/Akryum/nodepack/commit/cfd9c77))
* **cli:** if no command and in a project, run dev command ([576e336](https://github.com/Akryum/nodepack/commit/576e336))
* **cli:** nodepack inspect ([f851077](https://github.com/Akryum/nodepack/commit/f851077))
* **cli:** remove plugin ([e51af81](https://github.com/Akryum/nodepack/commit/e51af81))
* **cli:** service command ([9802bd3](https://github.com/Akryum/nodepack/commit/9802bd3))
* **cli:** upgrade plugins ([f75db0d](https://github.com/Akryum/nodepack/commit/f75db0d))
* **creator:** save preset ([6bc8e46](https://github.com/Akryum/nodepack/commit/6bc8e46))
* **creator:** select babel by default ([badc335](https://github.com/Akryum/nodepack/commit/badc335))
* **dev:** auto process.env.PORT ([c6adde5](https://github.com/Akryum/nodepack/commit/c6adde5))
* **env-check:** print env infos ([49e16c3](https://github.com/Akryum/nodepack/commit/49e16c3))
* **env-info:** print installed packages ([98bd4eb](https://github.com/Akryum/nodepack/commit/98bd4eb))
* **inspect:** don't output diagnose error plgin ([ddaa60b](https://github.com/Akryum/nodepack/commit/ddaa60b))
* **maintenance:** auto pre install deps ([e08a01f](https://github.com/Akryum/nodepack/commit/e08a01f))
* **maintenance:** complete log ([807f144](https://github.com/Akryum/nodepack/commit/807f144))
* **maintenance:** options defaults & skipCommit ([dfc778d](https://github.com/Akryum/nodepack/commit/dfc778d))
* **migrator:** wip migrate (currently only in create) ([c7dbcb2](https://github.com/Akryum/nodepack/commit/c7dbcb2))
* **service:** --no-minify ([25f394d](https://github.com/Akryum/nodepack/commit/25f394d))
* **service:** add 'start' script in app migration ([17b1b68](https://github.com/Akryum/nodepack/commit/17b1b68))
* **service:** always mark [@nodepack](https://github.com/nodepack)/module as external ([e03bd4c](https://github.com/Akryum/nodepack/commit/e03bd4c))
* **service:** build --watch ([e74e5e3](https://github.com/Akryum/nodepack/commit/e74e5e3))
* **service:** generate .gitignore ([5471074](https://github.com/Akryum/nodepack/commit/5471074))
* **service:** plugin apply can be async ([cffab21](https://github.com/Akryum/nodepack/commit/cffab21))
* **service:** project options typings ([1b06588](https://github.com/Akryum/nodepack/commit/1b06588))
* **service:** run maintenance ([bb76ba0](https://github.com/Akryum/nodepack/commit/bb76ba0))
* **ts:** generator ([d399622](https://github.com/Akryum/nodepack/commit/d399622))
* **ts:** tslint support ([a3eb078](https://github.com/Akryum/nodepack/commit/a3eb078))
* **ts:** wip generator ([70eef33](https://github.com/Akryum/nodepack/commit/70eef33))
* **webpack:** auto define env vars ([1f5dfcb](https://github.com/Akryum/nodepack/commit/1f5dfcb))
* **webpack:** default external whitelist ([0bc94ba](https://github.com/Akryum/nodepack/commit/0bc94ba))
* **webpack:** externals ([e696478](https://github.com/Akryum/nodepack/commit/e696478))
* **webpack:** supress size warnings ([b050079](https://github.com/Akryum/nodepack/commit/b050079))
* typescript plugin ([2450203](https://github.com/Akryum/nodepack/commit/2450203))



