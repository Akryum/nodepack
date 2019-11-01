export interface PassportUser {
  id: string
}

export default interface PassportContext<U = PassportUser> {
  user: U
  account: U
  login: (user: U) => Promise<void>
  logout: () => Promise<void>
}
