import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface DoctorAppointment {
  id: number
  patient_id: number
  patient_pseudonym: string
  patient_email: string
  title: string
  starts_at: string
  ends_at: string
  mode: 'in-person' | 'video'
  status: string
}

export type AppointmentScope = 'upcoming' | 'past'

export const doctorAppointmentsApi = {
  list: (scope: AppointmentScope, auth: AuthTokenAdapter) =>
    requestJson<DoctorAppointment[]>(`${API_BASE_URL}/api/appointments/doctor/?scope=${scope}`, { method: 'GET' }, auth),
}
