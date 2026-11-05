export type RiskLevel = 'none' | 'low' | 'moderate' | 'high'

/** Mêmes seuils que le reste du frontend (Patients.tsx / RiskDonut). */
export const HIGH_RISK = 0.6
export const MODERATE_RISK = 0.4

export const riskLevel = (score: number | null): RiskLevel =>
  score === null ? 'none' : score >= HIGH_RISK ? 'high' : score >= MODERATE_RISK ? 'moderate' : 'low'

export const riskColor: Record<RiskLevel, string> = {
  high: '#e11d48',
  moderate: '#f59e0b',
  low: '#14b8a6',
  none: '#94a3b8',
}

export const riskLabel: Record<RiskLevel, string> = {
  high: 'Évolution à surveiller',
  moderate: 'Risque modéré, à suivre',
  low: 'Risque faible',
  none: 'Pas encore analysée',
}

export const riskHint: Record<RiskLevel, string> = {
  high: 'Le modèle estime un risque élevé de progression. Une relecture clinique rapide est recommandée.',
  moderate: 'Le modèle estime un risque intermédiaire. Une surveillance rapprochée peut être envisagée.',
  low: 'Le modèle ne détecte pas de signe marqué d’évolution sur cette IRM.',
  none: 'Lancez l’analyse pour obtenir une estimation du risque.',
}
