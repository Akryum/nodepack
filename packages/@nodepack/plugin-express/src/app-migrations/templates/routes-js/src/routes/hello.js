import hello from '@/views/hello.ejs'

/**
 * @param {import('@nodepack/plugin-express').ExpressContext} ctx
 */
export default function ({ express: app }) {
  app.get('/', (req, res) => {
    res.send(hello({ user: req.user }))
  })

  app.get('/foo/:foo', (req, res) => {
    res.send(`Foo: ${req.params.foo}`)
  })
}
