import type { UserRole } from './auth'

export type AssignableRole = Extract<UserRole, 'patient' | 'doctor'>

export interface AuthMeProfile {
  patient_profile_id?: number
  pseudonym?: string
  doctor_profile_id?: number
  license_number?: string
  specialty?: string
}

export interface AuthMe {
  id: number
  email: string
  role: UserRole
  profile: AuthMeProfile
}

export interface AdminUserItem {
  keycloak_id: string
  email: string
  enabled: boolean
  roles: string[]
}

export interface AdminCreateUserPayload {
  email: string
  role: AssignableRole
  temporary_password?: string
}

export interface AdminCreatedUser {
  keycloak_id: string
  email: string
  role: AssignableRole
}

export interface DetailResponse {
  detail: string
}

export interface PatientProfileApi {
  id: number
  user_email: string
  pseudonym: string
  birth_date: string | null
}

export interface PatientClinicalUpdatePayload {
  birth_date: string | null
}