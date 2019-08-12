import path from 'path'
import { loadModule } from '@nodepack/module'

loadModule(path.resolve(process.env.NODEPACK_DIRNAME, 'runtime'), process.env.NODEPACK_DIRNAME)
