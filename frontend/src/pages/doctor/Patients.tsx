import { Brain, CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useDoctorPatients } from '../../hooks/useDoctorPatients'
import { formatDate } from '../../lib/format'

export const riskTone = (score: number | null) =>
  score === null ? 'blue' : score >= 0.6 ? 'rose' : score >= 0.4 ? 'amber' : 'teal'

export const DoctorPatients = () => {
  const { data = [], isLoading, isError, error, refetch } = useDoctorPatients()

  return (
    <AppShell>
      <section className="mb-5">
        <h1 className="text-2xl font-semibold text-text">Mes patients</h1>
        <p className="mt-1 text-sm text-text-muted">Cliquez sur un patient pour consulter ses IRM.</p>
      </section>

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
      {isLoading && <Skeleton className="h-40 w-full" />}
      {!isLoading && !isError && data.length === 0 && (
        <EmptyState title="Aucun patient" description="Les patients qui vous sont assignés apparaîtront ici." />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((p) => (
          <Link key={p.id} to={`/doctor/patients/${p.id}`}>
            <Card title={p.pseudonym} className="transition hover:shadow-soft">
              <p className="text-sm text-text-muted">{p.email}</p>
              <p className="mt-1 text-xs text-text-soft">
                Naissance : {p.birth_date ? formatDate(p.birth_date) : '—'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="blue"><Brain size={12} className="mr-1 inline" />{p.scans_count} IRM</Badge>
                {p.pending_count > 0 && <Badge tone="amber">{p.pending_count} à analyser</Badge>}
                {p.last_risk_score !== null && (
                  <Badge tone={riskTone(p.last_risk_score)}>
                    Risque {(p.last_risk_score * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>

              <p className="mt-3 flex items-center gap-1 text-xs text-text-soft">
                <CalendarClock size={12} />
                Dernier envoi : {p.last_upload ? formatDate(p.last_upload) : '—'}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}