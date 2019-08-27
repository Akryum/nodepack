import { Strategy } from 'passport'

export interface PassportUser {
  id: string
}

export interface PassportContext<U = PassportUser> {
  user: U
  account: U
  login: (user: U) => Promise<void>
  logout: () => Promise<void>
}

// Helpers

export function useStrategy (
  strategy: Strategy,
  setupRoutes?: (ctx: any) => Promise<void> | void
): void

export interface UserSerializationPayload<U = PassportUser> {
  user: U
  serialized: string
}

export function serializeUser<U = PassportUser> (
  callback: (
    ctx: PassportContext<U>,
    payload: UserSerializationPayload<U>
  ) => Promise<string> | string | void
): void

export function deserializeUser<U = PassportUser> (
  callback: (
    ctx: PassportContext<U>,
    payload: UserSerializationPayload<U>
  ) => Promise<U> | U | void
): void
