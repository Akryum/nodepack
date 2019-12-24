import { Client as FaunaClient } from 'faunadb'

export default interface FaunaContext {
  fauna: FaunaClient
}
