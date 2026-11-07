import { Activity, CalendarCheck, FileClock, Stethoscope, UsersRound } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { Avatar } from '../../components/ui/Avatar'
import { PageHero } from '../../components/ui/PageHero'
import { delayStyle } from '../../components/doctor/mri/motion'
import '../../components/doctor/mri/mri.css'
import { useAuth } from '../../contexts/AuthContext'
import { useDoctorDashboard } from '../../hooks/useDoctorDashboard'
import { chartColors } from '../../styles/tokens'
import { formatDate, formatRelative } from '../../lib/format'

const riskTone = {
  low: 'teal',
  moderate: 'amber',
  high: 'rose',
} as const

const riskWord = {
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
} as const

const statIcons = [UsersRound, CalendarCheck, Activity, FileClock]

const statGradients = [
  'linear-gradient(135deg, #dbeafe, #eff6ff)',
  'linear-gradient(135deg, #ccfbf1, #f0fdfa)',
  'linear-gradient(135deg, #fef3c7, #fffbeb)',
  'linear-gradient(135deg, #ede9fe, #f5f3ff)',
]

const statColors = ['#2563eb', '#0d9488', '#d97706', '#7c3aed']

export const DoctorDashboard = () => {
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = useDoctorDashboard() as any

  return (
    <AppShell>
      <PageHero
        icon={Stethoscope}
        title={`Bonjour ${user?.fullName ?? ''}`}
        subtitle="Voici un aperçu de vos patients et des actions à suivre aujourd’hui."
      />

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="doctor-stats">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!isLoading &&
          data?.metrics.map((metric: any, index: number) => {
            const Icon = statIcons[index % 4]
            const color = statColors[index % 4]
            return (
              <div
                key={metric.id}
                className="mri-fade-up flex items-start justify-between gap-3 rounded-2xl border p-5 shadow-soft transition-all duration-200 hover:-translate-y-1"
                style={{ background: statGradients[index % 4], ...delayStyle(index * 80) }}
              >
                <div>
                  <p className="text-sm text-text-muted">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-text">{metric.value}</p>
                  <p className="mt-1 text-xs text-text-soft">{metric.change}</p>
                </div>
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"
                  style={{ color }}
                >
                  <Icon size={22} aria-hidden="true" />
                </span>
              </div>
            )
          })}
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
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.fullName} size={34} />
                          <span className="font-medium text-text">{patient.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge tone={riskTone[patient.riskState as keyof typeof riskTone]}>
                          {riskWord[patient.riskState as keyof typeof riskWord] ?? patient.riskState}
                        </Badge>
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
            <EmptyState title="Aucune analyse récente" description="Les analyses IA apparaîtront ici." />
          )}
          {!isLoading && data?.quickPrediction && (
            <div className="space-y-3 text-sm text-text-muted">
              <Badge tone="rose">Brouillon – à valider par le médecin</Badge>
              <p className="text-3xl font-bold text-text">
                {(data.quickPrediction.risk_score * 100).toFixed(0)}%
              </p>
              <p className="font-semibold text-text">Probabilité estimée de progression sur l’horizon choisi</p>
              <p>{data.quickPrediction.summary}</p>
              <p className="text-xs text-text-soft">
                Cohérence {(data.quickPrediction.confidence * 100).toFixed(0)}% • Modèle{' '}
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
                <li key={alert.id} className="rounded-xl bg-surface-soft p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text">{alert.patientName}</p>
                    <Badge tone={riskTone[alert.severity as keyof typeof riskTone]}>
                      {riskWord[alert.severity as keyof typeof riskWord] ?? alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-text-muted">{alert.summary}</p>
                  <p className="mt-1 text-xs text-text-soft">{formatRelative(alert.createdAt)}</p>
                  <Badge tone="rose" className="mt-2">
                    Brouillon – à valider par le médecin
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
                <li key={consultation.id} className="flex items-center gap-3 rounded-xl bg-surface-soft p-3">
                  <Avatar name={consultation.patientName} size={38} />
                  <div>
                    <p className="font-semibold text-text">{consultation.patientName}</p>
                    <p className="text-text-muted">
                      {formatDate(consultation.date)} • {consultation.startTime}
                    </p>
                    <p className="text-text-soft">{consultation.purpose}</p>
                  </div>
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
                <li key={report.id} className="rounded-xl bg-surface-soft p-3">
                  <p className="font-semibold text-text">{report.patientName}</p>
                  <p className="text-text-muted">{formatRelative(report.createdAt)}</p>
                  <Badge tone="rose" className="mt-2">
                    Brouillon – à valider par le médecin
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
                  <Tooltip />
                  <Line type="monotone" dataKey="memory" name="Mémoire" stroke={chartColors.memory} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="attention" name="Attention" stroke={chartColors.attention} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="regularity" name="Régularité" stroke={chartColors.regularity} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}