import type { UserRole } from '../types'
import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

type ManagedRole = Extract<UserRole, 'patient' | 'doctor'>

export interface AdminUserItem {
  keycloak_id: string
  email: string
  enabled: boolean
  roles: string[]
}

const base = `${API_BASE_URL}/api/auth/admin/users/`

export const adminUsersApi = {
  list: (auth: AuthTokenAdapter) => requestJson<AdminUserItem[]>(base, { method: 'GET' }, auth),
  create: (payload: { email: string; role: ManagedRole; temporary_password?: string }, auth: AuthTokenAdapter) =>
    requestJson<AdminUserItem>(base, { method: 'POST', body: JSON.stringify(payload) }, auth),
  toggleEnabled: (id: string, enabled: boolean, auth: AuthTokenAdapter) =>
    requestJson<{ detail: string }>(`${base}${id}/`, { method: 'PATCH', body: JSON.stringify({ enabled }) }, auth),
  changeRole: (id: string, role: ManagedRole, auth: AuthTokenAdapter) =>
    requestJson<{ detail: string }>(`${base}${id}/`, { method: 'PATCH', body: JSON.stringify({ role }) }, auth),
  resetPassword: (id: string, temporaryPassword: string | undefined, auth: AuthTokenAdapter) =>
    requestJson<{ detail: string }>(
      `${base}${id}/reset-password/`,
      { method: 'POST', body: JSON.stringify(temporaryPassword ? { temporary_password: temporaryPassword } : {}) },
      auth,
    ),
  remove: (id: string, auth: AuthTokenAdapter) => requestJson<void>(`${base}${id}/`, { method: 'DELETE' }, auth),
}