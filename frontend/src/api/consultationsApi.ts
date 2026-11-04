import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface JoinResponse {
  token: string
  url: string
  room: string
  role: 'patient' | 'doctor'
  patient_consent: boolean
  patient_name: string
  doctor_email: string
  starts_at: string
}

export interface ConsultationSummary {
  mots_cles?: string[]
  motif?: string
  symptomes?: string[]
  resultats_discutes?: string[]
  actions_proposees?: string[]
  points_incertains?: string[]
  traduction?: string
  error?: string
}

export interface ConsultationReport {
  patient: string
  starts_at: string
  started_at: string | null
  ended_at: string | null
  status: 'waiting' | 'in_progress' | 'ended'
  summary: ConsultationSummary
  transcript: string
  validated_at: string | null
}
export interface PastConsultation {
  appointment_id: number
  starts_at: string
  motif: string
  mots_cles: string[]
  validated: boolean
}

const base = `${API_BASE_URL}/api/consultations/`

export const consultationsApi = {
  join: (appointmentId: number, consent: boolean | undefined, auth: AuthTokenAdapter) =>
    requestJson<JoinResponse>(
      `${base}${appointmentId}/join/`,
      { method: 'POST', body: JSON.stringify(consent === undefined ? {} : { consent }) },
      auth,
    ),
  end: (appointmentId: number, auth: AuthTokenAdapter) =>
    requestJson<{ status: string }>(`${base}${appointmentId}/end/`, { method: 'POST' }, auth),
  report: (appointmentId: number, auth: AuthTokenAdapter) =>
    requestJson<ConsultationReport>(`${base}${appointmentId}/report/`, { method: 'GET' }, auth),
  saveReport: (appointmentId: number, summary: ConsultationSummary, auth: AuthTokenAdapter) =>
    requestJson<{ ok: boolean }>(
      `${base}${appointmentId}/report/`,
      { method: 'PATCH', body: JSON.stringify({ summary }) },
      auth,
    ),
  validateReport: (appointmentId: number, auth: AuthTokenAdapter) =>
    requestJson<{ validated_at: string }>(`${base}${appointmentId}/report/`, { method: 'POST' }, auth),
  forPatient: (patientId: number, auth: AuthTokenAdapter) =>
    requestJson<PastConsultation[]>(`${base}patient/${patientId}/`, { method: 'GET' }, auth),
}