import { cn } from './cn'

interface ProgressBarProps {
  value: number
  className?: string
}

export const ProgressBar = ({ value, className }: ProgressBarProps) => (
  <div className={cn('h-2 w-full rounded-full bg-brand-blue-soft', className)}>
    <div
      className="h-full rounded-full bg-brand-blue transition-all"
      style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      aria-hidden="true"
    />
  </div>
)
