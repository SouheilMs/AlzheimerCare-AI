import { API_BASE_URL, requestJson, type AuthTokenAdapter } from './client'

export interface MriScan {
  id: number
  file: string
  uploaded_at: string
  status: 'pending' | 'analyzing' | 'done' | 'failed'
}

const base = `${API_BASE_URL}/api/patients/me/mri-scans/`

export const mriApi = {
  list: (auth: AuthTokenAdapter) => requestJson<MriScan[]>(base, { method: 'GET' }, auth),
  upload: (file: File, auth: AuthTokenAdapter) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestJson<MriScan>(base, { method: 'POST', body: formData }, auth)
  },
}