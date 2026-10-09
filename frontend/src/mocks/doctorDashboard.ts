import type { DoctorDashboardData } from '../types'

export const doctorDashboardMock: DoctorDashboardData = {
  metrics: [
    { id: 'm1', label: 'Patients suivis', value: '28', change: '+2 ce mois' },
    { id: 'm2', label: 'Consultations aujourd’hui', value: '6', change: '+3 vs hier' },
    { id: 'm3', label: 'Alertes IA', value: '8', change: '+12% nouveaux signaux' },
    { id: 'm4', label: 'Rapports à valider', value: '2', change: 'En attente depuis 2 jours' },
  ],
  patientsNeedingAttention: [
    {
      id: 'p1',
      fullName: 'M. Dupont',
      age: 76,
      identifier: 'AC-0427',
      riskState: 'high',
      lastConsultationDate: '12 juillet 2024',
      reason: 'Déclin cognitif observé',
    },
    {
      id: 'p2',
      fullName: 'Mme Martin',
      age: 71,
      identifier: 'AC-0679',
      riskState: 'moderate',
      lastConsultationDate: '8 juillet 2024',
      reason: 'Baisse d’attention',
    },
    {
      id: 'p3',
      fullName: 'M. Bernard',
      age: 81,
      identifier: 'AC-0198',
      riskState: 'moderate',
      lastConsultationDate: '5 juillet 2024',
      reason: 'Plaintes de mémoire',
    },
  ],
  alerts: [
    {
      id: 'al1',
      patientId: 'p1',
      patientName: 'M. Dupont',
      severity: 'high',
      summary: 'Évolution inhabituelle des scores de mémoire épisodique.',
      createdAt: 'Il y a 15 minutes',
      requiresValidation: true,
    },
  ],
  consultations: [
    {
      id: 'c1',
      patientId: 'p1',
      patientName: 'M. Dupont',
      date: 'Mercredi 24 juillet 2024',
      startTime: '10:30',
      durationMinutes: 30,
      modality: 'video',
      purpose: 'Consultation de suivi',
    },
  ],
  reports: [
    {
      id: 'r1',
      patientId: 'p1',
      patientName: 'M. Dupont',
      createdAt: 'Aujourd’hui, 09:45',
      status: 'awaiting_validation',
      requiresValidation: true,
    },
    {
      id: 'r2',
      patientId: 'p2',
      patientName: 'Mme Martin',
      createdAt: 'Hier, 16:10',
      status: 'awaiting_validation',
      requiresValidation: true,
    },
  ],
  quickPrediction: {
    id: 'pred-1',
    patientId: 'p1',
    state: 'high',
    risk_score: 0.68,
    confidence: 0.82,
    model_version: 'DL-v2.3.1',
    horizon: '12 mois',
    summary:
      'Estimated probability of progression over the chosen horizon is elevated and should be reviewed with clinical context.',
    requiresValidation: true,
  },
}
