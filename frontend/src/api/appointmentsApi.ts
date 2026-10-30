import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface Slot {
  starts_at: string
  ends_at: string
}

export interface SuggestedSlots {
  doctor: { id: number; email: string; license_number: string }
  slots: Slot[]
}

export interface Appointment {
  id: number
  doctor: number
  doctor_email: string
  title: string
  starts_at: string
  ends_at: string
  mode: 'in-person' | 'video'
  status: string
}

const base = `${API_BASE_URL}/api/appointments/`

export const appointmentsApi = {
  suggestedSlots: (auth: AuthTokenAdapter) =>
    requestJson<SuggestedSlots>(`${base}suggested-slots/`, { method: 'GET' }, auth),
  book: (payload: { doctor_id: number; starts_at: string }, auth: AuthTokenAdapter) =>
    requestJson<Appointment>(base, { method: 'POST', body: JSON.stringify(payload) }, auth),
}