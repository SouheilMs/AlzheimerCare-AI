export type RiskState = 'low' | 'moderate' | 'high'

export interface Patient {
  id: string
  fullName: string
  age: number | null
  identifier: string
  riskState: RiskState
  lastConsultationDate: string | null
  reason: string
}

export interface Appointment {
  id: string
  title: string
  clinician: string
  date: string
  startTime: string
  endTime: string
  mode: 'in-person' | 'video'
  notes?: string
}

export interface CognitiveScore {
  month: string
  memory: number | null
  attention: number | null
  regularity: number | null
}

export interface Alert {
  id: string
  patientId: string
  patientName: string
  severity: RiskState
  summary: string
  createdAt: string
  requiresValidation: boolean
}

export interface Consultation {
  id: string
  patientId: string
  patientName: string
  date: string
  startTime: string
  durationMinutes: number
  modality: 'in-person' | 'video'
  purpose: string
}

export interface Report {
  id: string
  patientId: string
  patientName: string
  createdAt: string
  status: 'draft' | 'awaiting_validation' | 'validated'
  requiresValidation: boolean
}

export interface Prediction {
  id: string
  patientId: string
  state: RiskState
  risk_score: number
  confidence: number
  model_version: string
  horizon: string
  summary: string
  requiresValidation: boolean
}
