import { useEffect, useState } from 'react'
import { useCountUp } from './motion'
import { riskColor, riskLevel } from './risk'

export const AnimatedRiskRing = ({ value, size = 200 }: { value: number; size?: number }) => {
  const r = 52
  const circumference = 2 * Math.PI * r
  const level = riskLevel(value)
  const color = riskColor[level]
  const [drawn, setDrawn] = useState(0)
  const percent = useCountUp(value * 100, 1400)

  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {level === 'high' && (
        <span className="mri-halo absolute inset-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="relative -rotate-90"
        role="img"
        aria-label={`Risque d’évolution : ${Math.round(value * 100)} %`}
      >
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="11" />
        <circle
          className="mri-ring-progress"
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - drawn)}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-text-muted">Risque d’évolution</span>
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  )
}
