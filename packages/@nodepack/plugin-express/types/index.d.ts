import { Express, Request, Response } from 'express'

export interface ExpressContext {
  express: Express
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
