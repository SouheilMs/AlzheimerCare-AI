import { Brain, CalendarClock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { Avatar } from '../../components/ui/Avatar'
import { PageHero } from '../../components/ui/PageHero'
import { useDoctorPatients } from '../../hooks/useDoctorPatients'
import { formatDate } from '../../lib/format'
import '../../components/doctor/mri/mri.css'
import { delayStyle } from '../../components/doctor/mri/motion'

export const riskTone = (score: number | null) =>
  score === null ? 'blue' : score >= 0.6 ? 'rose' : score >= 0.4 ? 'amber' : 'teal'

const riskWord = (score: number) => (score >= 0.6 ? 'Élevé' : score >= 0.4 ? 'Modéré' : 'Faible')

export const DoctorPatients = () => {
  const { data = [], isLoading, isError, error, refetch } = useDoctorPatients()

  return (
    <AppShell>
      <PageHero
        icon={Users}
        title="Mes patients"
        subtitle="Cliquez sur un patient pour consulter ses IRM."
        right={<Badge tone="blue">{data.length} patient{data.length > 1 ? 's' : ''}</Badge>}
      />

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
      {isLoading && <Skeleton className="h-40 w-full" />}
      {!isLoading && !isError && data.length === 0 && (
        <EmptyState title="Aucun patient" description="Les patients qui vous sont assignés apparaîtront ici." />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((p, index) => (
          <Link
            key={p.id}
            to={`/doctor/patients/${p.id}`}
            className="mri-fade-up block rounded-2xl border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
            style={delayStyle(Math.min(index, 8) * 70)}
          >
            <div className="flex items-center gap-3">
              <Avatar name={p.email} size={48} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{p.pseudonym}</p>
                <p className="truncate text-sm text-text-muted">{p.email}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="blue">
                <Brain size={12} className="mr-1 inline" />
                {p.scans_count} IRM
              </Badge>
              {p.pending_count > 0 && <Badge tone="amber">{p.pending_count} à analyser</Badge>}
              {p.last_risk_score !== null && (
                <Badge tone={riskTone(p.last_risk_score)}>
                  {riskWord(p.last_risk_score)} · {(p.last_risk_score * 100).toFixed(0)}%
                </Badge>
              )}
            </div>

            <p className="mt-4 flex items-center gap-1 text-xs text-text-soft">
              <CalendarClock size={12} />
              Dernier envoi : {p.last_upload ? formatDate(p.last_upload) : '—'}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}