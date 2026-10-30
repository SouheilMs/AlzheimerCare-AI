import { useState } from 'react'
import { Button, Card, Skeleton, WidgetError } from '../ui'
import { useBookAppointment, useSuggestedSlots } from '../../hooks/useAppointments'

const formatSlot = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Tunis',
  }).format(new Date(iso))

export const BookingDialog = ({ onClose }: { onClose: () => void }) => {
  const { data, isLoading, isError, error, refetch } = useSuggestedSlots()
  const book = useBookAppointment()
  const [selected, setSelected] = useState<string | null>(null)

  const confirm = () => {
    if (!data || !selected) return
    book.mutate({ doctor_id: data.doctor.id, starts_at: selected }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-text/40 p-4" role="dialog" aria-modal="true">
      <Card title="Prenez rendez-vous avec un médecin" className="w-full max-w-lg">
        <p className="mb-3 text-sm text-text-muted">
          Votre dernière IRM présente un risque élevé. Nous vous conseillons de consulter rapidement.
        </p>

        {isLoading && <Skeleton className="h-32 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

        {data && (
          <>
            <p className="mb-2 text-sm font-semibold text-text">Médecin : {data.doctor.email}</p>
            <ul className="space-y-2">
              {data.slots.map((slot) => (
                <li key={slot.starts_at}>
                  <button
                    type="button"
                    onClick={() => setSelected(slot.starts_at)}
                    className={`w-full rounded-md border p-3 text-left text-sm ${
                      selected === slot.starts_at ? 'border-brand-blue bg-brand-blue-soft' : 'bg-surface-soft'
                    }`}
                  >
                    {formatSlot(slot.starts_at)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {book.isError && (
          <p className="mt-3 text-sm text-brand-rose" role="alert">
            {book.error.message}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={confirm} disabled={!selected || book.isPending}>
            {book.isPending ? 'Réservation…' : 'Confirmer le rendez-vous'}
          </Button>
        </div>
      </Card>
    </div>
  )
}