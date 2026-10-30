import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface NotificationItem {
  id: number
  message: string
  link: string
  created_at: string
  read_at: string | null
}

export interface NotificationsResponse {
  unread_count: number
  results: NotificationItem[]
}

const base = `${API_BASE_URL}/api/notifications/`

export const notificationsApi = {
  list: (auth: AuthTokenAdapter) => requestJson<NotificationsResponse>(base, { method: 'GET' }, auth),
  markRead: (id: number, auth: AuthTokenAdapter) =>
    requestJson<void>(`${base}${id}/read/`, { method: 'POST' }, auth),
  markAllRead: (auth: AuthTokenAdapter) => requestJson<void>(`${base}read-all/`, { method: 'POST' }, auth),
}