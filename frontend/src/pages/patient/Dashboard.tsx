import { Brain, CalendarClock, ClipboardList, Gamepad2, TrendingUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppShell } from '../../components/layout/AppShell'
import { chartColors } from '../../styles/tokens'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { PageHero } from '../../components/ui/PageHero'
import { usePatientDashboard } from '../../hooks/usePatientDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/format'
import '../../components/doctor/mri/mri.css'

export const PatientDashboard = () => {
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = usePatientDashboard()

  return (
    <AppShell>
      <PageHero
        icon={Brain}
        title={`Bonjour ${user?.fullName.split(' ')[0]}`}
        subtitle="Ravi de vous revoir ! Continuons ensemble sur ce beau chemin."
      />

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          className="mri-fade-up flex items-center gap-4 rounded-2xl p-5 text-left text-white shadow-soft transition hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <ClipboardList size={24} />
          </span>
          <span>
            <span className="block text-base font-semibold">Commencer un test</span>
            <span className="block text-xs text-white/80">Évaluez vos capacités cognitives</span>
          </span>
        </button>

        <button
          type="button"
          className="mri-fade-up flex items-center gap-4 rounded-2xl p-5 text-left text-white shadow-soft transition hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)', ['--d' as string]: '80ms' }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Gamepad2 size={24} />
          </span>
          <span>
            <span className="block text-base font-semibold">Jouer maintenant</span>
            <span className="block text-xs text-white/80">Stimulez votre mémoire</span>
          </span>
        </button>

        <button
          type="button"
          className="mri-fade-up flex items-center gap-4 rounded-2xl border bg-surface p-5 text-left shadow-soft transition hover:-translate-y-1"
          style={{ ['--d' as string]: '160ms' }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-soft text-brand-blue">
            <TrendingUp size={24} />
          </span>
          <span>
            <span className="block text-base font-semibold text-text">Voir mon évolution</span>
            <span className="block text-xs text-text-muted">Suivez vos progrès</span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Votre suivi actuel" className="xl:col-span-2">
          {isLoading && <Skeleton className="h-20 w-full" />}
          {!isLoading && data && (
            <>
              <Badge tone="teal">{data.followUpStatus.label}</Badge>
              <p className="mt-3 text-sm text-text-muted">{data.followUpStatus.detail}</p>
            </>
          )}
        </Card>

        <Card title="Prochaine étape">
          {isLoading && <Skeleton className="h-20 w-full" />}
          {!isLoading && data && (
            <>
              <p className="text-sm font-semibold text-text">{data.nextActivity.title}</p>
              <p className="mt-2 text-sm text-text-muted">{data.nextActivity.description}</p>
              <Button variant="secondary" className="mt-4 w-full">
                Toutes les activités
              </Button>
            </>
          )}
        </Card>

        <Card title="Évolution de mes résultats" className="xl:col-span-2" data-testid="patient-chart">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {!isLoading && data && data.scoreEvolution.length > 0 && (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={data.scoreEvolution}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="memory" stroke={chartColors.memory} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="attention" stroke={chartColors.attention} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="regularity" stroke={chartColors.regularity} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {!isLoading && data && data.scoreEvolution.length === 0 && (
            <EmptyState
              title="Aucune évolution disponible"
              description="Vos résultats de suivi apparaîtront ici après quelques activités."
            />
          )}
        </Card>

        <Card title="Mes jeux cognitifs" data-testid="patient-games">
          {isLoading && <Skeleton className="h-36 w-full" />}
          {!isLoading && data && data.cognitiveGames.length === 0 && (
            <EmptyState title="Aucun jeu pour le moment" description="Nous préparons de nouvelles activités." />
          )}
          {!isLoading && data && data.cognitiveGames.length > 0 && (
            <ul className="space-y-3">
              {data.cognitiveGames.map((game) => (
                <li key={game.id} className="rounded-xl bg-surface-soft p-3">
                  <p className="text-sm font-semibold text-text">{game.name}</p>
                  <p className="text-xs text-text-muted">
                    {game.duration} • {game.level}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Mon prochain rendez-vous" data-testid="patient-appointments">
          {isLoading && <Skeleton className="h-28 w-full" />}
          {!isLoading && data && data.appointments.length > 0 && (
            <article className="space-y-2">
              <p className="text-sm font-semibold text-text">{data.appointments[0].clinician}</p>
              <p className="text-sm text-text-muted">{formatDate(data.appointments[0].date)}</p>
              <Badge tone="blue">{data.appointments[0].mode === 'video' ? 'Visioconférence' : 'En cabinet'}</Badge>
            </article>
          )}
          {!isLoading && data && data.appointments.length === 0 && (
            <EmptyState title="Aucun rendez-vous" description="Vous êtes à jour pour le moment." />
          )}
        </Card>

        <Card title="Mes notifications" className="xl:col-span-2" data-testid="patient-notifications">
          {isLoading && <Skeleton className="h-28 w-full" />}
          {!isLoading && data && data.notifications.length > 0 && (
            <ul className="space-y-2 text-sm text-text-muted">
              {data.notifications.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl bg-surface-soft p-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden="true">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {!isLoading && data && data.notifications.length === 0 && (
            <EmptyState title="Aucune notification" description="Nous vous informerons des nouveautés utiles." />
          )}
        </Card>

        <Card className="bg-brand-amber-soft">
          <div className="space-y-2 text-sm text-text">
            <p className="font-semibold">“Chaque petit pas compte pour aujourd’hui et pour demain.”</p>
            <div className="flex gap-3 text-text-muted">
              <CalendarClock size={16} aria-hidden="true" />
              <Gamepad2 size={16} aria-hidden="true" />
              <TrendingUp size={16} aria-hidden="true" />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}