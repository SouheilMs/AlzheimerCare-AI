import type { PatientClinicalUpdatePayload, PatientProfileApi } from '../types'
import { apiBaseUrl, requestJson, type AuthTokenAdapter } from './client'

export const patientsApi = {
  get(id: number, auth: AuthTokenAdapter) {
    return requestJson<PatientProfileApi>(`${apiBaseUrl}/api/patients/${id}/`, { method: 'GET' }, auth)
  },
  updateClinical(id: number, payload: PatientClinicalUpdatePayload, auth: AuthTokenAdapter) {
    return requestJson<PatientClinicalUpdatePayload>(
      `${apiBaseUrl}/api/patients/${id}/clinical/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      auth,
    )
  },
}