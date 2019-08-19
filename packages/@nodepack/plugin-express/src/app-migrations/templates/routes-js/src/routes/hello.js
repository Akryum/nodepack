/**
 * @param {import('@nodepack/plugin-express').ExpressContext} ctx
 */
export default function ({ express: app }) {
  app.get('/', (req, res) => {
    res.send(`Hello world`)
  })

  app.get('/foo/:foo', (req, res) => {
    res.send(`Foo: ${req.params.foo}`)
  })
}
