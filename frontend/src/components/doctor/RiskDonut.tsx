export const RiskDonut = ({ value }: { value: number }) => {
  const r = 52
  const c = 2 * Math.PI * r
  const color = value >= 0.6 ? '#e11d48' : value >= 0.4 ? '#f59e0b' : '#14b8a6'
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-text-muted">Risque d’évolution</span>
        <span className="text-3xl font-bold" style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
    </div>
  )
}