import type { DoctorDashboardData, PatientDashboardData } from '../types'
import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export const dashboardApi = {
  getPatientDashboard: (auth: AuthTokenAdapter) =>
    requestJson<PatientDashboardData>(`${API_BASE_URL}/api/dashboard/patient/`, { method: 'GET' }, auth),
  getDoctorDashboard: (auth: AuthTokenAdapter) =>
    requestJson<DoctorDashboardData>(`${API_BASE_URL}/api/dashboard/doctor/`, { method: 'GET' }, auth),
}