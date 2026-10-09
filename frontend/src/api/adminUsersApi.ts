import type {
  AdminCreatedUser,
  AdminCreateUserPayload,
  AdminUserItem,
  AssignableRole,
  DetailResponse,
} from '../types'
import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export type { AdminUserItem }

const usersUrl = `${API_BASE_URL}/api/auth/admin/users/`

export const adminUsersApi = {
  list(auth: AuthTokenAdapter) {
    return requestJson<AdminUserItem[]>(usersUrl, { method: 'GET' }, auth)
  },
  create(payload: AdminCreateUserPayload, auth: AuthTokenAdapter) {
    return requestJson<AdminCreatedUser>(usersUrl, { method: 'POST', body: JSON.stringify(payload) }, auth)
  },
  toggleEnabled(keycloakId: string, enabled: boolean, auth: AuthTokenAdapter) {
    return requestJson<DetailResponse>(
      `${usersUrl}${keycloakId}/`,
      { method: 'PATCH', body: JSON.stringify({ enabled }) },
      auth,
    )
  },
  changeRole(keycloakId: string, role: AssignableRole, auth: AuthTokenAdapter) {
    return requestJson<DetailResponse>(
      `${usersUrl}${keycloakId}/`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
      auth,
    )
  },
}