import { X } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Button } from '../ui'

interface Props {
  onConfirm: () => void
  pending?: boolean
  error?: string | null
}

// Le bouton peut se trouver dans un <Link> : on bloque la navigation sur chaque clic
const stop = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

export const CancelAppointmentButton = ({ onConfirm, pending = false, error = null }: Props) => {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button
        variant="secondary"
        onClick={(e: MouseEvent) => {
          stop(e)
          setAsking(true)
        }}
      >
        <X size={16} className="mr-2 inline" />
        Annuler
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2" onClick={stop}>
      <span className="text-xs font-medium text-text">Annuler ce rendez-vous ?</span>
      <Button
        onClick={(e: MouseEvent) => {
          stop(e)
          onConfirm()
        }}
        disabled={pending}
      >
        {pending ? 'Annulation…' : 'Oui, annuler'}
      </Button>
      <Button
        variant="secondary"
        onClick={(e: MouseEvent) => {
          stop(e)
          setAsking(false)
        }}
        disabled={pending}
      >
        Non
      </Button>
      {error && (
        <span className="w-full text-xs text-brand-rose" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
