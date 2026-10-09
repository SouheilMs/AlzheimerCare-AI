import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface WidgetErrorProps {
  message: string
  onRetry: () => void
}

export const WidgetError = ({ message, onRetry }: WidgetErrorProps) => (
  <div className="rounded-lg border border-brand-rose bg-brand-rose-soft p-4">
    <div className="flex items-start gap-2">
      <AlertCircle size={16} className="mt-0.5 text-brand-rose" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-text">Impossible de charger cette section</p>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
    <Button className="mt-3" variant="secondary" onClick={onRetry}>
      Réessayer
    </Button>
  </div>
)
