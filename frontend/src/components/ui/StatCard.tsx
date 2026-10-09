import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
}

export const StatCard = ({ title, value, change, icon: Icon }: StatCardProps) => (
  <Card className="bg-surface-soft">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-text-muted">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
        <p className="mt-1 text-xs text-text-soft">{change}</p>
      </div>
      <div className="rounded-md bg-brand-blue-soft p-2 text-brand-blue">
        <Icon size={18} aria-hidden="true" />
      </div>
    </div>
  </Card>
)
