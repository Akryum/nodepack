#!/usr/bin/env node

const { watchBuild } = require('../lib/watch-build')

watchBuild(process.cwd())
