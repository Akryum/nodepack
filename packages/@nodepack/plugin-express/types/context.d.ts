import { Express, Request, Response } from 'express'
import { Server } from 'http'

export default interface ExpressContext {
  express: Express
  httpServer: Server
  req: Request
  res: Response
  port: Number
}
