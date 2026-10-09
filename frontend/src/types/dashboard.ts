import type {
  Alert,
  Appointment,
  CognitiveScore,
  Consultation,
  Patient,
  Prediction,
  Report,
} from './domain'

export interface PatientDashboardData {
  followUpStatus: {
    label: string
    detail: string
  }
  nextActivity: {
    title: string
    description: string
  }
  cognitiveGames: Array<{
    id: string
    name: string
    duration: string
    level: string
  }>
  appointments: Appointment[]
  notifications: string[]
  scoreEvolution: CognitiveScore[]
}

export interface DoctorDashboardData {
  metrics: Array<{
    id: string
    label: string
    value: string
    change: string
  }>
  patientsNeedingAttention: Patient[]
  alerts: Alert[]
  consultations: Consultation[]
  reports: Report[]
  quickPrediction: Prediction | null
  scoreEvolution: CognitiveScore[]
}
