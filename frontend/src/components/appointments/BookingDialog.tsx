import { CalendarCheck, CheckCircle2, Stethoscope, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Appointment, Slot } from '../../api/appointmentsApi'
import { delayStyle } from '../doctor/mri/motion'
import '../doctor/mri/mri.css'
import { useBookAppointment, useSuggestedSlots } from '../../hooks/useAppointments'
import { Button, Card, Skeleton, WidgetError } from '../ui'

const TZ = 'Africa/Tunis'

const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))
const weekday = (iso: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: TZ }).format(new Date(iso))
const dayNumber = (iso: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: TZ }).format(new Date(iso))
const monthShort = (iso: string) => new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: TZ }).format(new Date(iso))
const time = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso))
const longSlot = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso))

interface BookingDialogProps {
  onClose: () => void
  reason?: string
}

export const BookingDialog = ({
  onClose,
  reason = 'Suite à l’analyse de votre IRM, un suivi médical est recommandé. Choisissez votre médecin et un créneau.',
}: BookingDialogProps) => {
  const [doctorId, setDoctorId] = useState<number | undefined>(undefined)
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useSuggestedSlots({ doctorId })
  const book = useBookAppointment()

  const [pickedDay, setPickedDay] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<'in-person' | 'video'>('in-person')
  const [booked, setBooked] = useState<Appointment | null>(null)

  const activeDoctor = data?.doctor
  const doctors = data?.doctors ?? (data ? [data.doctor] : [])

  // Regroupe les créneaux par jour, du plus proche au plus lointain
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of data?.slots ?? []) {
      const key = dayKey(slot.starts_at)
      map.set(key, [...(map.get(key) ?? []), slot])
    }
    return Array.from(map, ([key, slots]) => ({ key, slots }))
  }, [data])

  const currentDay = days.find((d) => d.key === pickedDay) ?? days[0]

  const chooseDoctor = (id: number) => {
    setDoctorId(id)
    setPickedDay(null)
    setSelected(null)
  }

  const confirm = () => {
    if (!activeDoctor || !selected) return
    book.mutate(
      { doctor_id: activeDoctor.id, starts_at: selected, mode },
      { onSuccess: (appointment) => setBooked(appointment) },
    )
  }

  if (booked) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-text/40 p-4" role="dialog" aria-modal="true">
        <Card title="Rendez-vous confirmé" className="w-full max-w-md">
          <div className="mri-fade-up flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={56} style={{ color: '#14b8a6' }} className="mri-pop" />
            <p className="text-lg font-semibold text-text">{longSlot(booked.starts_at)}</p>
            <p className="text-sm text-text-muted">avec {booked.doctor_email}</p>
            <p className="text-xs text-text-soft">
              Le médecin a été prévenu. Vous retrouverez ce rendez-vous dans « Appointments ».
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-text/40 p-4" role="dialog" aria-modal="true">
      <Card title="Prenez rendez-vous avec un médecin" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto">
        <p className="mb-4 text-sm text-text-muted">{reason}</p>

        {isLoading && <Skeleton className="h-40 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

        {data && (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* 1. Choix du médecin */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">1. Choisissez votre médecin</p>
            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {doctors.map((d) => {
                const active = d.id === activeDoctor?.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => chooseDoctor(d.id)}
                    className={`flex items-center gap-3 rounded-md border p-3 text-left text-sm transition hover:-translate-y-0.5 ${
                      active ? 'border-brand-blue bg-brand-blue-soft' : 'bg-surface-soft'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-brand-blue">
                      <Stethoscope size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-text">{d.name ?? d.email}</span>
                      <span className="block truncate text-xs text-text-muted">{d.specialty || d.email}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 2. Calendrier : jours les plus proches */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">2. Choisissez un jour</p>
            {days.length === 0 ? (
              <p className="mb-5 rounded-md bg-surface-soft p-3 text-sm text-text-muted">
                Aucun créneau disponible pour ce médecin dans les prochains jours. Essayez un autre médecin.
              </p>
            ) : (
              <>
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                  {days.map((d, index) => {
                    const active = d.key === currentDay?.key
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          setPickedDay(d.key)
                          setSelected(null)
                        }}
                        className={`mri-fade-up flex w-[76px] shrink-0 flex-col items-center rounded-lg border px-2 py-2 text-center transition hover:-translate-y-0.5 ${
                          active ? 'border-brand-blue bg-brand-blue-soft' : 'bg-surface'
                        }`}
                        style={delayStyle(index * 50)}
                      >
                        <span className="text-xs uppercase text-text-muted">{weekday(d.slots[0].starts_at)}</span>
                        <span className="text-xl font-bold text-text">{dayNumber(d.slots[0].starts_at)}</span>
                        <span className="text-xs text-text-muted">{monthShort(d.slots[0].starts_at)}</span>
                        <span className="mt-1 text-[10px] text-text-soft">
                          {index === 0 ? 'Le plus proche' : `${d.slots.length} créneaux`}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* 3. Heure */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">3. Choisissez une heure</p>
                <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {currentDay?.slots.map((slot) => (
                    <button
                      key={slot.starts_at}
                      type="button"
                      onClick={() => setSelected(slot.starts_at)}
                      className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                        selected === slot.starts_at ? 'border-brand-blue bg-brand-blue-soft text-brand-blue' : 'bg-surface-soft text-text'
                      }`}
                    >
                      {time(slot.starts_at)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Mode */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-text-muted">Type de consultation :</span>
              {(
                [
                  ['in-person', 'Au cabinet', CalendarCheck],
                  ['video', 'En visio', Video],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    mode === value ? 'border-brand-blue bg-brand-blue-soft text-brand-blue' : 'bg-surface text-text-muted'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {book.isError && (
          <p className="mt-3 text-sm text-brand-rose" role="alert">
            {book.error.message}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-text-soft">{selected ? longSlot(selected) : 'Aucun créneau sélectionné'}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Plus tard
            </Button>
            <Button onClick={confirm} disabled={!selected || book.isPending}>
              {book.isPending ? 'Réservation…' : 'Confirmer le rendez-vous'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
