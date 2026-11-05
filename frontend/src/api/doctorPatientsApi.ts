import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'
import type { MriScan } from './mriApi'

export interface PatientCardItem {
  id: number
  pseudonym: string
  email: string
  birth_date: string | null
  scans_count: number
  pending_count: number
  last_upload: string | null
  last_risk_score: number | null
}

export interface DoctorScan extends MriScan {
  model_version: string
  analyzed_at: string | null
}

const base = `${API_BASE_URL}/api/patients/`

export const doctorPatientsApi = {
  list: (auth: AuthTokenAdapter) =>
    requestJson<PatientCardItem[]>(`${base}doctor/patients/`, { method: 'GET' }, auth),
  scans: (patientId: number, auth: AuthTokenAdapter) =>
    requestJson<DoctorScan[]>(`${base}${patientId}/mri-scans/`, { method: 'GET' }, auth),
  analyze: (scanId: number, auth: AuthTokenAdapter) =>
    requestJson<DoctorScan>(`${base}mri-scans/${scanId}/analyze/`, { method: 'POST' }, auth),
}