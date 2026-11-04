import { CalendarCheck, CalendarClock, Clock3, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppointmentScope, DoctorAppointment } from '../../api/doctorAppointmentsApi'
import { delayStyle } from '../../components/doctor/mri/motion'
import '../../components/doctor/mri/mri.css'
import { StatTile } from '../../components/doctor/mri/StatTile'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useDoctorAppointments } from '../../hooks/useDoctorAppointments'
import { JoinConsultationButton } from '../../components/appointments/JoinConsultationButton'

const TZ = 'Africa/Tunis'

const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))
const time = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso))
const longDay = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(new Date(iso))

const dayTitle = (iso: string): string => {
  const key = dayKey(iso)
  if (key === dayKey(new Date().toISOString())) return `Aujourd’hui · ${longDay(iso)}`
  if (key === dayKey(new Date(Date.now() + 86_400_000).toISOString())) return `Demain · ${longDay(iso)}`
  return longDay(iso)
}

const TABS: Array<{ key: AppointmentScope; label: string }> = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passés et annulés' },
]

export const DoctorAppointments = () => {
  const [scope, setScope] = useState<AppointmentScope>('upcoming')
  const { data = [], isLoading, isError, error, refetch } = useDoctorAppointments(scope)

  const groups = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>()
    for (const a of data) {
      const key = dayKey(a.starts_at)
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return Array.from(map, ([key, items]) => ({ key, items }))
  }, [data])

  const todayKey = dayKey(new Date().toISOString())
  const todayCount = data.filter((a) => dayKey(a.starts_at) === todayKey).length
  const next = scope === 'upcoming' ? data[0] : undefined

  return (
    <AppShell>
      <section className="mri-fade-up mb-5">
        <h1 className="text-2xl font-semibold text-text">Mes rendez-vous</h1>
        <p className="mt-1 text-sm text-text-muted">
          Les consultations prises par vos patients. La liste se met à jour automatiquement.
        </p>
      </section>

      {scope === 'upcoming' && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile icon={CalendarCheck} label="Rendez-vous à venir" value={data.length} delay={0} />
          <StatTile icon={Clock3} label="Aujourd’hui" value={todayCount} color="#f59e0b" delay={80} />
          <StatTile
            icon={CalendarClock}
            label="Prochain rendez-vous"
            value={next ? `${time(next.starts_at)}` : '—'}
            hint={next ? `${dayTitle(next.starts_at)} · ${next.patient_pseudonym}` : 'Aucun rendez-vous prévu'}
            color="#6366f1"
            delay={160}
          />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setScope(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              scope === t.key ? 'border-brand-blue bg-brand-blue-soft text-brand-blue' : 'bg-surface text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
      {isLoading && <Skeleton className="h-40 w-full" />}
      {!isLoading && !isError && data.length === 0 && (
        <EmptyState
          title={scope === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}
          description="Quand un patient réserve un créneau avec vous, il apparaît ici."
        />
      )}

      <div className="space-y-6">
        {groups.map((group, gi) => {
          const isToday = group.key === todayKey
          return (
            <section key={group.key} className="mri-fade-up" style={delayStyle(gi * 90)}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-text">{dayTitle(group.items[0].starts_at)}</h2>
              <ul className="space-y-2">
                {group.items.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/doctor/patients/${a.patient_id}`}
                      className="flex items-center gap-4 overflow-hidden rounded-lg border bg-surface p-3 shadow-soft transition hover:-translate-y-0.5"
                    >
                      <span className="h-12 w-1 shrink-0 rounded-full" style={{ backgroundColor: isToday ? '#f59e0b' : '#2563eb' }} />
                      <div className="w-24 shrink-0 text-center">
                        <p className="text-lg font-bold tabular-nums text-text">{time(a.starts_at)}</p>
                        <p className="text-xs text-text-soft">→ {time(a.ends_at)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-text">{a.patient_pseudonym}</p>
                        <p className="truncate text-sm text-text-muted">{a.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <Badge tone="blue">
                          {a.mode === 'video' && <Video size={12} className="mr-1 inline" />}
                          {a.mode === 'video' ? 'Visio' : 'Au cabinet'}
                        </Badge>
                        {scope === 'past' && (
                          <Badge tone={a.status === 'cancelled' ? 'rose' : 'teal'}>
                            {a.status === 'cancelled' ? 'Annulé' : a.status === 'completed' ? 'Terminé' : 'Passé'}
                          </Badge>
                        )}
                        <JoinConsultationButton appointmentId={a.id} mode={a.mode} startsAt={a.starts_at} endsAt={a.ends_at} status={a.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </AppShell>
  )
}
