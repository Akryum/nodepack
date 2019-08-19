import { ExpressContext } from '@nodepack/plugin-express'

export default function ({ express: app }: ExpressContext) {
  app.get('/', (req, res) => {
    res.send(`Hello world`)
  })

  app.get('/foo/:foo', (req, res) => {
    res.send(`Foo: ${req.params.foo}`)
  })
}