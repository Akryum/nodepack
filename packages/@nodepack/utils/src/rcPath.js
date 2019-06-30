const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const xdgConfigPath = (file, { xdgFolder }) => {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME
  if (xdgConfigHome) {
    const rcDir = path.join(xdgConfigHome, xdgFolder)
    if (!fs.existsSync(rcDir)) {
      // @ts-ignore
      fs.ensureDirSync(rcDir, 0o700)
    }
    return path.join(rcDir, file)
  }
}

exports.getRcPath = (file, { xdgFolder = 'nodepack' } = {}) => {
  return (
    process.env.NODEPACK_CONFIG_PATH ||
    xdgConfigPath(file, { xdgFolder }) ||
    path.join(os.homedir(), file)
  )
}
