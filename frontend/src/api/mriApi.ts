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

const base = `${API_BASE_URL}/api/patients/me/mri-scans/`

export const mriApi = {
  list: (auth: AuthTokenAdapter) => requestJson<MriScan[]>(base, { method: 'GET' }, auth),
  upload: (file: File, auth: AuthTokenAdapter) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestJson<MriUploadResult>(base, { method: 'POST', body: formData }, auth)
  },
}