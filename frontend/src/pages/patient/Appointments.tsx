import { CalendarCheck, CalendarPlus, Video } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookingDialog } from '../../components/appointments/BookingDialog'
import { delayStyle } from '../../components/doctor/mri/motion'
import '../../components/doctor/mri/mri.css'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useMyAppointments } from '../../hooks/useAppointments'
import { JoinConsultationButton } from '../../components/appointments/JoinConsultationButton'

const when = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Tunis',
  }).format(new Date(iso))

export const PatientAppointments = () => {
  const [params, setParams] = useSearchParams()
  // La notification « rendez-vous recommandé » ouvre directement le calendrier (?book=1)
  const [open, setOpen] = useState(params.get('book') === '1')
  const { data = [], isLoading, isError, error, refetch } = useMyAppointments()

  const close = () => {
    setOpen(false)
    if (params.has('book') || params.has('scan')) {
      const next = new URLSearchParams(params)
      next.delete('book')
      next.delete('scan')
      setParams(next, { replace: true })
    }
  }

  return (
    <AppShell>
      <section className="mri-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Mes rendez-vous</h1>
          <p className="mt-1 text-sm text-text-muted">Vos consultations à venir avec votre médecin.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <CalendarPlus size={16} className="mr-2 inline" />
          Prendre rendez-vous
        </Button>
      </section>

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
      {isLoading && <Skeleton className="h-32 w-full" />}
      {!isLoading && !isError && data.length === 0 && (
        <EmptyState
          title="Aucun rendez-vous à venir"
          description="Prenez rendez-vous avec votre médecin : les créneaux les plus proches vous sont proposés."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((a, index) => (
          <div key={a.id} className="mri-fade-up" style={delayStyle(index * 80)}>
            <Card title={a.title}>
              <p className="flex items-center gap-2 text-sm font-semibold capitalize text-text">
                <CalendarCheck size={16} className="text-brand-blue" />
                {when(a.starts_at)}
              </p>
              <p className="mt-1 text-sm text-text-muted">Médecin : {a.doctor_email}</p>
              <div className="mt-3 flex gap-2">
                <Badge tone="teal">Confirmé</Badge>
                <Badge tone="blue">
                  {a.mode === 'video' ? <Video size={12} className="mr-1 inline" /> : null}
                  {a.mode === 'video' ? 'Visio' : 'Au cabinet'}
                </Badge>
              </div>
              <div className="mt-3">
  <JoinConsultationButton appointmentId={a.id} mode={a.mode} startsAt={a.starts_at} endsAt={a.ends_at} status={a.status} />
</div>
            </Card>
          </div>
        ))}
      </div>

      {open && <BookingDialog onClose={close} />}
    </AppShell>
  )
}
