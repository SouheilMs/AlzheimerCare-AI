export type UserRole = 'patient' | 'doctor' | 'admin'

export interface AuthUser {
  id: string
  keycloakId: string
  fullName: string
  role: UserRole
  email: string
}
