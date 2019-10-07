import { Express, Request, Response } from 'express'
import { Server } from 'http'

export interface ExpressContext {
  express: Express
  httpServer: Server
  req: Request
  res: Response
  port: Number
}

// Extend Express types
declare global {
  namespace Express {
    export interface Request {
      user: any
      account: any
    }
  }
}
