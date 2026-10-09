import type { AuthMe } from '../types'
import { apiBaseUrl, requestJson, type AuthTokenAdapter } from './client'

export const authApi = {
  me(auth: AuthTokenAdapter) {
    return requestJson<AuthMe>(`${apiBaseUrl}/api/auth/me/`, { method: 'GET' }, auth)
  },
}