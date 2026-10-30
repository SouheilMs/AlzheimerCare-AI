import { useRef, useState, type ChangeEvent } from 'react'
import { ApiError } from '../../api/client'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useMriScans, useUploadMri } from '../../hooks/useMriScans'
import { formatDate } from '../../lib/format'
import { BookingDialog } from '../../components/appointments/BookingDialog'
const statusTone = {
  pending: 'amber',
  analyzing: 'blue',
  done: 'teal',
  failed: 'rose',
} as const

const statusLabel = {
  pending: 'En attente',
  analyzing: 'Analyse en cours',
  done: 'Analysée',
  failed: 'Échec',
} as const

export const MriUpload = () => {
  const { data: scans = [], isLoading, isError, error, refetch } = useMriScans()
  const upload = useUploadMri()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.zip')) {
  setLocalError('Format non accepté. Envoyez un fichier ZIP contenant 16 images PNG.')
  return
}
    setLocalError(null)
    upload.mutate(file, {
  onSuccess: (scan) => {
    if (scan.needs_appointment) setShowBooking(true)
  },
})
  }

  const serverError = (() => {
    const err = upload.error
    if (!err) return null
    if (err instanceof ApiError) {
      const details = err.details as { file?: string[] } | undefined
      if (details?.file?.[0]) return details.file[0]
    }
    return err.message
  })()

  return (
    <AppShell>
      <section className="mb-5">
        <h1 className="text-2xl font-semibold text-text">Mes IRM</h1>
        <p className="mt-1 text-sm text-text-muted">
          Importez vos IRM cérébrales pour qu’elles soient analysées.
        </p>
      </section>

      <Card title="Importer une IRM" className="mb-4">
        <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={handleChange} />

        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? 'Envoi en cours…' : 'Choisir un fichier'}
        </Button>
        <p className="mt-2 text-xs text-text-muted">
  Format accepté : un fichier .zip contenant 16 images PNG (100 Mo maximum).
</p>
        {(localError ?? serverError) && (
          <p className="mt-2 text-sm text-brand-rose" role="alert">
            {localError ?? serverError}
          </p>
        )}
      </Card>

      <Card title="IRM envoyées">
        {isLoading && <Skeleton className="h-28 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
        {!isLoading && !isError && scans.length === 0 && (
          <EmptyState title="Aucune IRM" description="Vos IRM envoyées apparaîtront ici." />
        )}
        {scans.length > 0 && (
          <ul className="space-y-2">
            {scans.map((scan) => (
              <li key={scan.id} className="flex items-center justify-between rounded-md bg-surface-soft p-3 text-sm">
                <div>
                  <p className="font-semibold text-text">{decodeURIComponent(scan.file.split('/').pop() ?? '')}</p>
                  <p className="text-text-muted">{formatDate(scan.uploaded_at)}</p>
                </div>
                <Badge tone={statusTone[scan.status]}>{statusLabel[scan.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {showBooking && <BookingDialog onClose={() => setShowBooking(false)} />}
    </AppShell>
  )
}