import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface Slot {
  starts_at: string
  ends_at: string
}

export interface DoctorOption {
  id: number
  email: string
  license_number: string
  name?: string
  specialty?: string
}

export interface SuggestedSlots {
  doctor: DoctorOption
  doctors?: DoctorOption[]
  slots: Slot[]
}

export interface Appointment {
  id: number
  doctor: number
  doctor_email: string
  doctor_name?: string
  title: string
  starts_at: string
  ends_at: string
  mode: 'in-person' | 'video'
  status: string
  can_cancel?: boolean
}

export interface BookPayload {
  doctor_id: number
  starts_at: string
  mode?: 'in-person' | 'video'
}

const base = `${API_BASE_URL}/api/appointments/`

export const appointmentsApi = {
  suggestedSlots: (auth: AuthTokenAdapter, opts: { doctorId?: number; limit?: number } = {}) => {
    const params = new URLSearchParams()
    if (opts.doctorId !== undefined) params.set('doctor_id', String(opts.doctorId))
    if (opts.limit !== undefined) params.set('limit', String(opts.limit))
    const query = params.toString()
    return requestJson<SuggestedSlots>(`${base}suggested-slots/${query ? `?${query}` : ''}`, { method: 'GET' }, auth)
  },
  list: (auth: AuthTokenAdapter) => requestJson<Appointment[]>(base, { method: 'GET' }, auth),
  book: (payload: BookPayload, auth: AuthTokenAdapter) =>
    requestJson<Appointment>(base, { method: 'POST', body: JSON.stringify(payload) }, auth),
  cancel: (id: number, auth: AuthTokenAdapter) =>
    requestJson<Appointment>(`${base}${id}/cancel/`, { method: 'POST' }, auth),
}
