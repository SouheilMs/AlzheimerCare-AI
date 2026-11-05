import '@livekit/components-styles'
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { ArrowLeft, FileText, Lock, ShieldCheck, Sparkles, Video } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, WidgetError } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useEndConsultation, useJoinConsultation } from '../../hooks/useConsultation'

const Stage = () => {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false })
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

export const ConsultationRoom = () => {
  const appointmentId = Number(useParams().appointmentId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const isPatient = user?.role === 'patient'
  const backTo = isPatient ? '/patient/appointments' : '/doctor/appointments'

  const join = useJoinConsultation(appointmentId)
  const end = useEndConsultation(appointmentId)
  const [consent, setConsent] = useState(false)
  const session = join.data

  const finish = async () => {
  if (!isPatient) {
    await end.mutateAsync().catch(() => undefined)
    navigate(`/doctor/consultations/${appointmentId}/report`)
    return
  }
  navigate(backTo)
}

  return (
    <AppShell>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft size={14} /> Retour aux rendez-vous
      </Link>

      <section className="mri-fade-up mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Consultation vidéo</h1>
          <p className="mt-1 text-sm text-text-muted">
            {session ? `Patient : ${session.patient_name}` : 'La salle est intégrée à l’application, sans service externe.'}
          </p>
        </div>
        {session && <Badge tone="teal">● Consultation en cours</Badge>}
      </section>

      {!session && (
        <Card title="Rejoindre la consultation">
          <div className="space-y-4 text-sm">
            <p className="flex items-start gap-2 text-text-muted">
              <Lock size={16} className="mt-0.5 shrink-0 text-brand-blue" />
              L’appel passe par le serveur de l’application. Aucune donnée n’est envoyée à un service externe.
            </p>

            {isPatient ? (
              <label className="flex items-start gap-2 rounded-md bg-surface-soft p-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                <span className="text-text">
                  J’accepte que cette consultation soit enregistrée et transcrite par l’IA afin de préparer le compte
                  rendu médical de mon médecin.
                </span>
              </label>
            ) : (
              <p className="rounded-md bg-surface-soft p-3 text-text-muted">
                Le patient devra donner son consentement à l’enregistrement avant d’entrer.
              </p>
            )}

            {join.isError && <WidgetError message={join.error.message} onRetry={() => join.reset()} />}

            <Button
              onClick={() => join.mutate(isPatient ? consent : undefined)}
              disabled={join.isPending || (isPatient && !consent)}
            >
              <Video size={16} className="mr-2 inline" />
              {join.isPending ? 'Connexion…' : 'Entrer dans la salle'}
            </Button>
          </div>
        </Card>
      )}

      {session && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="overflow-hidden rounded-lg border bg-slate-900 p-3 xl:col-span-2">
            <LiveKitRoom
              data-lk-theme="default"
              token={session.token}
              serverUrl={session.url}
              connect
              video
              audio={{
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
}}
onDisconnected={() => navigate(isPatient ? backTo : `/doctor/consultations/${appointmentId}/report`)}              style={{ height: 460, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ flex: 1, minHeight: 0 }}>
                <Stage />
              </div>
              <ControlBar controls={{ chat: false, settings: false }} />
              <RoomAudioRenderer />
            </LiveKitRoom>
            {!isPatient && (
              <div className="mt-3 flex justify-end">
                <Button variant="secondary" onClick={() => void finish()} disabled={end.isPending}>
                  Terminer la consultation pour tous
                </Button>
              </div>
            )}
          </div>

          <Card title="Compte rendu par l’IA">
            <div className="space-y-3 text-sm text-text-muted">
              <p className="flex items-start gap-2">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                Après la consultation, l’agent IA génère la transcription et un résumé que vous pourrez modifier et
                valider.
              </p>
              <p className="flex items-start gap-2">
                <FileText size={16} className="mt-0.5 shrink-0" />
                Motif · Symptômes · Résultats discutés · Actions proposées
              </p>
            </div>
          </Card>

          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm xl:col-span-3"
            style={{ borderColor: '#99f6e4', backgroundColor: '#f0fdfa' }}
          >
            <ShieldCheck size={20} style={{ color: '#0d9488' }} />
            <p className="text-text">
              <span className="font-semibold">Enregistrement avec le consentement du patient.</span>{' '}
              {session.patient_consent ? 'Consentement donné.' : 'En attente du consentement du patient.'}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  )
}
