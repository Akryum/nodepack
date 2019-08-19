export function password (app, ctx) {
  const config = ctx.config.password
  if (config) {
    const whitelist = config.pathWhitelist || []
    const realm = config.realm || 'app'

    app.use(async (req, res, next) => {
      if (req.method !== 'OPTIONS' && !(await isPathWhitelisted(req, whitelist))) {
        try {
          // parse login and password from headers
          const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
          const strauth = new Buffer(b64auth, 'base64').toString()
          const [, login, password] = strauth.match(/(.*?):(.*)/) || [undefined, '', '']

          if (!login || !password || login !== config.login || password !== config.password) {
            res.set('WWW-Authenticate', `Basic realm="${realm}"`)
            res.status(401).send('Authentication required.')
            return
          }
        } catch (e) {
          console.error(e)
        }
      }
      next()
    })
  }
}

async function isPathWhitelisted (req, whitelist) {
  if (typeof whitelist) {
    return whitelist(req)
  } else if (Array.isArray(whitelist)) {
    return whitelist.includes
  } else if (whitelist instanceof RegExp) {
    return whitelist.test(req.path)
  }
}
