import type { PatientClinicalUpdatePayload, PatientProfileApi } from '../types'
import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export const patientsApi = {
  get(id: number, auth: AuthTokenAdapter) {
    return requestJson<PatientProfileApi>(`${API_BASE_URL}/api/patients/${id}/`, { method: 'GET' }, auth)
  },
  updateClinical(id: number, payload: PatientClinicalUpdatePayload, auth: AuthTokenAdapter) {
    return requestJson<PatientClinicalUpdatePayload>(
      `${API_BASE_URL}/api/patients/${id}/clinical/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      auth,
    )
  },
}