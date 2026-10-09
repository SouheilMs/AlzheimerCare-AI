import { Activity, CalendarCheck, FileClock, UsersRound } from 'lucide-react'
import { LineChart, ResponsiveContainer, XAxis, YAxis} from 'recharts'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Card, EmptyState, Skeleton, StatCard, WidgetError } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useDoctorDashboard } from '../../hooks/useDoctorDashboard'
import { formatDate, formatRelative } from '../../lib/format'

const riskTone = {
  low: 'teal',
  moderate: 'amber',
  high: 'rose',
} as const

const statIcons = [UsersRound, CalendarCheck, Activity, FileClock]

export const DoctorDashboard = () => {  
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = useDoctorDashboard() as any

  return (
    <AppShell>
      <section className="mb-5">
        <h1 className="text-2xl font-semibold text-text">Bonjour {user?.fullName}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Voici un aperçu de vos patients et des actions à suivre aujourd’hui.
        </p>
      </section>

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="doctor-stats">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!isLoading && data?.metrics.map((metric: any, index: any) => (
            <StatCard
              key={metric.id}
              title={metric.label}
              value={metric.value}
              change={metric.change}
              icon={statIcons[index]}
            />
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <Card title="Patients nécessitant une attention" className="2xl:col-span-2" data-testid="doctor-patients">
          {isLoading && <Skeleton className="h-44 w-full" />}
          {!isLoading && data && data.patientsNeedingAttention.length === 0 && (
            <EmptyState
              title="Aucun patient prioritaire"
              description="Tous les patients sont actuellement stables."
            />
          )}
          {!isLoading && data && data.patientsNeedingAttention.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-text-soft">
                  <tr>
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Risque actuel</th>
                    <th className="pb-2">Dernière consultation</th>
                    <th className="pb-2">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {data.patientsNeedingAttention.map((patient: any) => (
                    <tr key={patient.id} className="border-t">
                      <td className="py-3 font-medium text-text">{patient.fullName}</td>
                      <td className="py-3">
                        <Badge tone={riskTone[patient.riskState as keyof typeof riskTone]}>{patient.riskState}</Badge>
                      </td>
                      <td className="py-3 text-text-muted">{formatDate(patient.lastConsultationDate)}</td>
                      <td className="py-3 text-text-muted">{patient.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Accès rapide - Analyse Deep Learning" data-testid="doctor-prediction">
          {isLoading && <Skeleton className="h-44 w-full" />}
          {!isLoading && data && !data.quickPrediction && (
            <EmptyState
              title="Aucune analyse récente"
              description="Les analyses IA apparaîtront ici."
            />
          )}
          {!isLoading && data?.quickPrediction && (
            <div className="space-y-3 text-sm text-text-muted">
              <Badge tone="rose">Draft - requires doctor validation</Badge>
              <p className="font-semibold text-text">
                Estimated probability of progression over the chosen horizon:{' '}
                {(data.quickPrediction.risk_score * 100).toFixed(0)}%
              </p>
              <p>{data.quickPrediction.summary}</p>
              <p className="text-xs text-text-soft">
                Confiance {(data.quickPrediction.confidence * 100).toFixed(0)}% • Modèle{' '}
                {data.quickPrediction.model_version} • Horizon {data.quickPrediction.horizon}
              </p>
            </div>
          )}
        </Card>

        <Card title="Alertes IA" data-testid="doctor-alerts">
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && data && data.alerts.length === 0 && (
            <EmptyState title="Aucune alerte" description="Aucun nouveau signal à examiner." />
          )}
          {!isLoading && data && data.alerts.length > 0 && (
            <ul className="space-y-3">
              {data.alerts.map((alert: any) => (
                <li key={alert.id} className="rounded-md bg-surface-soft p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text">{alert.patientName}</p>
                    <Badge tone={riskTone[alert.severity as keyof typeof riskTone]}>{alert.severity}</Badge>
                  </div>
                  <p className="mt-1 text-text-muted">{alert.summary}</p>
                  <p className="mt-1 text-xs text-text-soft">{formatRelative(alert.createdAt)}</p>
                  <Badge tone="rose" className="mt-2">
                    Draft - requires doctor validation
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Consultations du jour" data-testid="doctor-consultations">
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && data && data.consultations.length === 0 && (
            <EmptyState title="Aucune consultation" description="Rien de prévu aujourd’hui." />
          )}
          {!isLoading && data && data.consultations.length > 0 && (
            <ul className="space-y-2 text-sm">
              {data.consultations.map((consultation: any) => (
                <li key={consultation.id} className="rounded-md bg-surface-soft p-3">
                  <p className="font-semibold text-text">{consultation.patientName}</p>
                  <p className="text-text-muted">
                    {formatDate(consultation.date)} • {consultation.startTime}
                  </p>
                  <p className="text-text-soft">{consultation.purpose}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Rapports en attente de validation" data-testid="doctor-reports">
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && data && data.reports.length === 0 && (
            <EmptyState title="Aucun rapport en attente" description="Tout est à jour." />
          )}
          {!isLoading && data && data.reports.length > 0 && (
            <ul className="space-y-2 text-sm">
              {data.reports.map((report: any) => (
                <li key={report.id} className="rounded-md bg-surface-soft p-3">
                  <p className="font-semibold text-text">{report.patientName}</p>
                  <p className="text-text-muted">{formatRelative(report.createdAt)}</p>
                  <Badge tone="rose" className="mt-2">
                    Draft - requires doctor validation
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Évolution des scores cognitifs" className="2xl:col-span-2" data-testid="doctor-chart">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {!isLoading && data && data.scoreEvolution.length === 0 && (
            <EmptyState
              title="Aucune évolution disponible"
              description="Les scores de vos patients apparaîtront ici après leurs premiers tests."
            />
          )}
          {!isLoading && data && data.scoreEvolution.length > 0 && (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={data.scoreEvolution}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
