import { useRef, useState, type ChangeEvent } from 'react'
import { ApiError } from '../../api/client'
import { BookingDialog } from '../../components/appointments/BookingDialog'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import {
  useChooseDoctor,
  useDoctorDirectory,
  useMriScans,
  useMyDoctors,
  useUploadMri,
} from '../../hooks/useMriScans'
import { formatDate } from '../../lib/format'
import { Brain } from 'lucide-react'
import { PageHero } from '../../components/ui/PageHero'
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
  const { data: doctors = [] } = useDoctorDirectory()
  const { data: myDoctors = [], isLoading: myDoctorsLoading } = useMyDoctors()
  const upload = useUploadMri()
  const choose = useChooseDoctor()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState('')

  const hasDoctor = myDoctors.length > 0
  const chosenIds = new Set(myDoctors.map((d) => d.doctor_id))
  const availableDoctors = doctors.filter((d) => !chosenIds.has(d.id))

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
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

  const handleChoose = () => {
    if (!selectedDoctor) return
    choose.mutate(Number(selectedDoctor), { onSuccess: () => setSelectedDoctor('') })
  }

  const serverError = (() => {
    const err = upload.error
    if (!err) return null
    if (err instanceof ApiError) {
      const details = err.details as { file?: string[]; detail?: string } | undefined
      if (details?.file?.[0]) return details.file[0]
      if (details?.detail) return details.detail
    }
    return err.message
  })()

  return (
    <AppShell>
     
<PageHero
  icon={Brain}
  title="Mes IRM"
  subtitle="Choisissez votre médecin, puis importez vos IRM cérébrales pour qu’elles soient analysées."
/>
      <Card title="Mon médecin" className="mb-4">
        {myDoctorsLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            {hasDoctor ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {myDoctors.map((d) => (
                  <Badge key={d.doctor_id} tone="teal">
                    {d.name}
                    {d.specialty ? ` · ${d.specialty}` : ''}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-sm text-text-muted">
                Vous devez choisir un médecin avant de pouvoir envoyer une IRM.
              </p>
            )}

            {availableDoctors.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  aria-label="Choisir un médecin"
                  className="min-w-[220px] rounded-md border bg-surface px-3 py-2 text-sm text-text"
                >
                  <option value="">{hasDoctor ? 'Ajouter un autre médecin…' : 'Choisir un médecin…'}</option>
                  {availableDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.specialty ? ` — ${d.specialty}` : ''}
                    </option>
                  ))}
                </select>
                <Button onClick={handleChoose} disabled={!selectedDoctor || choose.isPending}>
                  {choose.isPending ? 'Enregistrement…' : 'Valider'}
                </Button>
              </div>
            ) : (
              !hasDoctor && <p className="text-sm text-text-muted">Aucun médecin n’est disponible pour le moment.</p>
            )}

            {choose.isError && (
              <p className="mt-2 text-sm text-brand-rose" role="alert">
                {choose.error.message}
              </p>
            )}
          </>
        )}
      </Card>

      <Card title="Importer une IRM" className="mb-4">
        <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={handleChange} />

        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending || !hasDoctor}>
          {upload.isPending ? 'Envoi en cours…' : 'Choisir un fichier'}
        </Button>
        <p className="mt-2 text-xs text-text-muted">
          Format accepté : un fichier .zip contenant 16 images PNG (100 Mo maximum).
          {!hasDoctor && ' Choisissez d’abord votre médecin.'}
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