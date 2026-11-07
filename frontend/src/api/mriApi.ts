import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface MriScan {
  id: number
  file: string
  uploaded_at: string
  status: 'pending' | 'analyzing' | 'done' | 'failed'
  risk_score: number | null
  confidence: number | null
}

export interface MriUploadResult extends MriScan {
  high_risk: boolean
  needs_appointment: boolean
}

export interface DoctorOption {
  id: number
  name: string
  email: string
  specialty: string
}

export interface MyDoctor {
  doctor_id: number
  name: string
  specialty: string
  assigned_at: string
}

const base = `${API_BASE_URL}/api/patients/me/mri-scans/`
const doctorsUrl = `${API_BASE_URL}/api/patients/doctors/`
const myDoctorsUrl = `${API_BASE_URL}/api/patients/me/doctors/`

export const mriApi = {
  list: (auth: AuthTokenAdapter) => requestJson<MriScan[]>(base, { method: 'GET' }, auth),
  upload: (file: File, auth: AuthTokenAdapter) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestJson<MriUploadResult>(base, { method: 'POST', body: formData }, auth)
  },
  doctors: (auth: AuthTokenAdapter) => requestJson<DoctorOption[]>(doctorsUrl, { method: 'GET' }, auth),
  myDoctors: (auth: AuthTokenAdapter) => requestJson<MyDoctor[]>(myDoctorsUrl, { method: 'GET' }, auth),
  chooseDoctor: (doctorId: number, auth: AuthTokenAdapter) => {
    const formData = new FormData()
    formData.append('doctor_id', String(doctorId))
    return requestJson<{ doctor_id: number; created: boolean }>(
      myDoctorsUrl,
      { method: 'POST', body: formData },
      auth,
    )
  },
}