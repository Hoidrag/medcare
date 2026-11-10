export type AuthMode = 'login' | 'register'
export type AuthProvider = 'Google' | 'Facebook' | 'GitHub'
export type AuthCredentials = {
  name?: string
  email: string
  password: string
}
