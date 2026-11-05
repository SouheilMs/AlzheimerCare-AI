import type { LucideIcon } from 'lucide-react'
import { delayStyle, useCountUp } from './motion'

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
  color?: string
  delay?: number
}

export const StatTile = ({ icon: Icon, label, value, hint, color = '#2563eb', delay = 0 }: StatTileProps) => {
  const counted = useCountUp(typeof value === 'number' ? value : 0, 900)

  return (
    <div
      className="mri-fade-up rounded-lg border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5"
      style={delayStyle(delay)}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-text-muted">{label}</p>
          <p className="text-2xl font-bold tabular-nums text-text">
            {typeof value === 'number' ? Math.round(counted) : value}
          </p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-text-soft">{hint}</p>}
    </div>
  )
}
