import type { DoctorScan } from '../../../api/doctorPatientsApi'
import { delayStyle } from './motion'
import { riskColor } from './risk'

const W = 420
const H = 170
const PAD = { left: 38, right: 16, top: 12, bottom: 28 }

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

export const RiskTrend = ({ scans }: { scans: DoctorScan[] }) => {
  const points = scans
    .filter((s) => s.risk_score !== null)
    .slice()
    .sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime())

  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-text-muted">
        Au moins deux IRM analysées sont nécessaires pour afficher l’évolution du risque.
      </p>
    )
  }

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v) * (H - PAD.top - PAD.bottom)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.risk_score ?? 0)}`).join(' ')
  const area = `${line} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`
  const last = points.length - 1
  const showAllLabels = points.length <= 6

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Évolution du risque estimé">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0.4)} y2={y(0.4)} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1" />
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0.6)} y2={y(0.6)} stroke="#e11d48" strokeDasharray="4 4" strokeWidth="1" />

      <path d={area} fill="#2563eb" opacity="0.08" />
      <path d={line} pathLength={1} className="mri-draw" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => {
        const v = p.risk_score ?? 0
        const isLast = i === last
        return (
          <g key={p.id}>
            <circle
              className="mri-pop"
              style={delayStyle(600 + i * 120)}
              cx={x(i)}
              cy={y(v)}
              r={isLast ? 6 : 4}
              fill={isLast ? riskColor[v >= 0.6 ? 'high' : v >= 0.4 ? 'moderate' : 'low'] : '#fff'}
              stroke="#2563eb"
              strokeWidth="2"
            />
            {(showAllLabels || i === 0 || isLast) && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">
                {shortDate(p.uploaded_at)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
