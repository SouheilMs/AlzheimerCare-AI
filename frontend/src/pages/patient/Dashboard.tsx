import { CalendarClock, Gamepad2, TrendingUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import { AppShell } from '../../components/layout/AppShell'
import { chartColors } from '../../styles/tokens'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { usePatientDashboard } from '../../hooks/usePatientDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/format'

export const PatientDashboard = () => {
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = usePatientDashboard()

  return (
    <AppShell>
      <section className="mb-5">
        <h1 className="text-2xl font-semibold text-text">Bonjour {user?.fullName.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ravi de vous revoir ! Continuons ensemble sur ce beau chemin.
        </p>
      </section>

      {isError && (
        <WidgetError message={error.message} onRetry={() => void refetch()} />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Votre suivi actuel" className="xl:col-span-2">
          {isLoading && <Skeleton className="h-20 w-full" />}
          {!isLoading && data && (
            <>
              <Badge tone="teal">{data.followUpStatus.label}</Badge>
              <p className="mt-3 text-sm text-text-muted">{data.followUpStatus.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>Commencer un test</Button>
                <Button variant="secondary">Jouer maintenant</Button>
              </div>
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
                <li key={game.id} className="rounded-md bg-surface-soft p-3">
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
              <p className="text-sm text-text-muted">{data.appointments[0].date}</p>
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
                <li key={item} className="flex items-start gap-2 rounded-md bg-surface-soft p-3">
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
