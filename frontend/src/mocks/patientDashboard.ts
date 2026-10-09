import type { PatientDashboardData } from '../types'

export const patientDashboardMock: PatientDashboardData = {
  followUpStatus: {
    label: 'Stable',
    detail:
      'Vos résultats de suivi sont globalement stables ce dernier mois. Continuez vos activités !',
  },
  nextActivity: {
    title: 'Compléter le questionnaire du mois',
    description: '15 minutes pour personnaliser et adapter vos recommandations.',
  },
  cognitiveGames: [
    { id: 'g1', name: 'Mémoire visuelle', duration: '10 min', level: 'Niveau doux' },
    { id: 'g2', name: 'Attention rapide', duration: '8 min', level: 'Niveau progressif' },
  ],
  appointments: [
    {
      id: 'a1',
      title: 'Suivi neurologie',
      clinician: 'Dr. Leila Benali',
      date: 'Mercredi 24 juillet 2024',
      startTime: '10:30',
      endTime: '11:00',
      mode: 'video',
      notes: 'Échange sur vos résultats de suivi récents.',
    },
  ],
  notifications: [
    'Une courte activité cognitive est disponible pour aujourd’hui.',
    'Pensez à confirmer votre prochain rendez-vous.',
    'Le conseil du jour est prêt dans votre espace.',
  ],
  scoreEvolution: [
    { month: 'Fév', memory: 62, attention: 58, regularity: 64 },
    { month: 'Mar', memory: 65, attention: 60, regularity: 66 },
    { month: 'Avr', memory: 67, attention: 61, regularity: 68 },
    { month: 'Mai', memory: 69, attention: 64, regularity: 69 },
    { month: 'Juin', memory: 70, attention: 66, regularity: 71 },
    { month: 'Juil', memory: 72, attention: 68, regularity: 73 },
  ],
}
