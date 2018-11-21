exports.printEnvInfo = async function (env = false) {
  const os = require('os')
  const execa = require('execa')
  const si = require('systeminformation')

  console.log(`Node: ${process.version}`)
  try {
    const { stdout: npmVersion } = await execa('npm', ['--version'])
    console.log(`Npm:  ${npmVersion}`)
  } catch (e) {}
  try {
    const { stdout: yarnVersion } = await execa('yarn', ['--version'])
    console.log(`Yarn: ${yarnVersion}`)
  } catch (e) {}
  const osInfo = await si.osInfo()
  console.log(`OS:   ${os.platform()} ${os.arch()} ${os.release()} | ${osInfo.distro} ${osInfo.release}`)
  console.log(`CPU:  ${formatModels(os.cpus().map(info => info.model))}`)
  console.log(`RAM:  ${formatBytes(os.freemem())} free / ${formatBytes(os.totalmem())} total`)
  const sys = await si.system()
  console.log(`SYS:  manufacturer: ${sys.manufacturer || 'unknown'} model: ${sys.model || 'unknown'} version: ${sys.version || 'unknown'}`)
  if (env) {
    console.log('-- ENV --')
    console.log(process.env)
  }
}

function formatModels (models) {
  const count = {}
  for (const model of models) {
    if (!count[model]) {
      count[model] = 1
    } else {
      count[model]++
    }
  }

  const res = []
  for (const key in count) {
    res.push(`${count[key]}x[${key}]`)
  }
  return res.join(' | ')
}

const bytesUnits = ['B', 'kB', 'MB', 'GB', 'TB']

function formatBytes (bytes) {
  let result = bytes
  let index = 0
  while (index < bytesUnits.length - 1 && result > 1024) {
    result /= 1024
    index++
  }
  return `${Math.round(result)}${bytesUnits[index]}`
}
