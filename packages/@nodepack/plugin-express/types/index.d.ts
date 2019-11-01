export { default as ExpressContext } from './context'

// Extend Express types
declare global {
  namespace Express {
    export interface Request {
      user: any
      account: any
    }
  }
}
