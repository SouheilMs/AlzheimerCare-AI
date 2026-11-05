import type { AuthMe } from '../types'
import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export const authApi = {
  me(auth: AuthTokenAdapter) {
    return requestJson<AuthMe>(`${API_BASE_URL}/api/auth/me/`, { method: 'GET' }, auth)
  },
}