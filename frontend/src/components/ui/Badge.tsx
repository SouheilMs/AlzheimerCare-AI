import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type BadgeTone = 'blue' | 'teal' | 'amber' | 'rose'

const toneClasses: Record<BadgeTone, string> = {
  blue: 'bg-brand-blue-soft text-brand-blue',
  teal: 'bg-brand-teal-soft text-brand-teal',
  amber: 'bg-brand-amber-soft text-brand-amber',
  rose: 'bg-brand-rose-soft text-brand-rose',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export const Badge = ({ tone = 'blue', className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
)
