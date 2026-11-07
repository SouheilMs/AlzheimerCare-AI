import { AlertTriangle, Brain, Clock3, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PatientCardItem } from '../../api/doctorPatientsApi'
import { delayStyle } from '../../components/doctor/mri/motion'
import { HIGH_RISK, MODERATE_RISK, riskColor, riskLevel } from '../../components/doctor/mri/risk'
import { StatTile } from '../../components/doctor/mri/StatTile'
import '../../components/doctor/mri/mri.css'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useDoctorPatients } from '../../hooks/useDoctorPatients'
import { formatDate } from '../../lib/format'
import { PageHero } from '../../components/ui/PageHero'
type Category = 'attention' | 'pending' | 'monitor' | 'stable' | 'empty'
type Filter = 'all' | Category

const categoryOf = (p: PatientCardItem): Category => {
  if (p.scans_count === 0) return 'empty'
  if (p.last_risk_score !== null && p.last_risk_score >= HIGH_RISK) return 'attention'
  if (p.pending_count > 0) return 'pending'
  if (p.last_risk_score !== null && p.last_risk_score >= MODERATE_RISK) return 'monitor'
  return 'stable'
}

const PRIORITY: Record<Category, number> = { attention: 0, pending: 1, monitor: 2, stable: 3, empty: 4 }

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  attention: { label: 'Nécessite une attention', color: '#e11d48' },
  pending: { label: 'IRM à analyser', color: '#2563eb' },
  monitor: { label: 'À suivre', color: '#f59e0b' },
  stable: { label: 'Stable', color: '#14b8a6' },
  empty: { label: 'Sans IRM', color: '#94a3b8' },
}

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'attention', label: 'Attention requise' },
  { key: 'pending', label: 'À analyser' },
  { key: 'monitor', label: 'À suivre' },
  { key: 'stable', label: 'Stables' },
  { key: 'empty', label: 'Sans IRM' },
]

const MiniRing = ({ value, color }: { value: number | null; color: string }) => {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 50 50" className="-rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        {value !== null && (
          <circle
            cx="25"
            cy="25"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value)}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {value !== null ? `${Math.round(value * 100)}%` : '—'}
      </span>
    </div>
  )
}

export const MriOverview = () => {
  const { data = [], isLoading, isError, error, refetch } = useDoctorPatients()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const withCategory = useMemo(
    () =>
      data
        .map((p) => ({ patient: p, category: categoryOf(p) }))
        .sort(
          (a, b) =>
            PRIORITY[a.category] - PRIORITY[b.category] ||
            (b.patient.last_risk_score ?? 0) - (a.patient.last_risk_score ?? 0) ||
            (b.patient.last_upload ?? '').localeCompare(a.patient.last_upload ?? ''),
        ),
    [data],
  )

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: withCategory.length, attention: 0, pending: 0, monitor: 0, stable: 0, empty: 0 }
    withCategory.forEach((x) => {
      result[x.category] += 1
    })
    return result
  }, [withCategory])

  const totalScans = data.reduce((sum, p) => sum + p.scans_count, 0)
  const totalPending = data.reduce((sum, p) => sum + p.pending_count, 0)

  const visible = withCategory.filter(({ patient, category }) => {
    if (filter !== 'all' && category !== filter) return false
    const q = query.trim().toLowerCase()
    return !q || patient.pseudonym.toLowerCase().includes(q) || patient.email.toLowerCase().includes(q)
  })

  return (
    <AppShell>
   
<PageHero
  icon={Brain}
  title="IRM des patients"
  subtitle="Vue d’ensemble des IRM de tous vos patients. Cliquez sur une carte pour ouvrir ses IRM."
/>
      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <StatTile icon={Users} label="Patients suivis" value={data.length} delay={0} />
            <StatTile icon={Brain} label="IRM reçues" value={totalScans} color="#6366f1" delay={80} />
            <StatTile icon={Clock3} label="IRM à analyser" value={totalPending} color="#f59e0b" delay={160} />
            <StatTile
              icon={AlertTriangle}
              label="Attention requise"
              value={counts.attention}
              color="#e11d48"
              delay={240}
            />
          </>
        )}
      </div>

      {counts.attention > 0 && (
        <div
          className="mri-fade-up mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{ ...delayStyle(300), borderColor: '#fecdd3', backgroundColor: '#fff1f2' }}
        >
          <span className="mri-dot h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#e11d48' }} />
          <p className="text-text">
            <span className="font-semibold">{counts.attention}</span> patient{counts.attention > 1 ? 's' : ''}{' '}
            nécessite{counts.attention > 1 ? 'nt' : ''} une attention : risque estimé élevé sur la dernière IRM analysée.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border bg-surface px-3 py-2 sm:max-w-xs">
          <Search size={16} className="text-text-soft" aria-hidden="true" />
          <span className="sr-only">Rechercher un patient</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un patient…"
            className="w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-text-soft"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === f.key ? 'border-brand-blue bg-brand-blue-soft text-brand-blue' : 'bg-surface text-text-muted'
              }`}
            >
              {f.label} <span className="ml-1 opacity-70">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Skeleton className="h-40 w-full" />}
      {!isLoading && !isError && visible.length === 0 && (
        <EmptyState
          title="Aucun patient dans cette catégorie"
          description="Les patients correspondants apparaîtront ici dès qu’ils auront envoyé une IRM."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ patient: p, category }, index) => {
          const meta = CATEGORY_META[category]
          const ringColor = riskColor[riskLevel(p.last_risk_score)]
          return (
            <Link
              key={p.id}
              to={`/doctor/patients/${p.id}`}
              className="mri-fade-up group block overflow-hidden rounded-lg border bg-surface shadow-soft transition hover:-translate-y-1"
              style={delayStyle(Math.min(index, 8) * 60)}
            >
              <div className="h-1" style={{ backgroundColor: meta.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">{p.pseudonym}</p>
                    <p className="truncate text-sm text-text-muted">{p.email}</p>
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                  </div>
                  <MiniRing value={p.last_risk_score} color={ringColor} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="blue">
                    <Brain size={12} className="mr-1 inline" />
                    {p.scans_count} IRM
                  </Badge>
                  {p.pending_count > 0 && <Badge tone="amber">{p.pending_count} à analyser</Badge>}
                </div>

                <p className="mt-3 text-xs text-text-soft">
                  Dernier envoi : {p.last_upload ? formatDate(p.last_upload) : '—'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </AppShell>
  )
}
