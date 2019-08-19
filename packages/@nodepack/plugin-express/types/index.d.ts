import { Express, Request, Response } from 'express'

export interface ExpressContext {
  express: Express
  req: Request
  res: Response
  port: Number
}
