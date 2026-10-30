import { AlertTriangle, ArrowLeft, Brain } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { RiskDonut } from '../../components/doctor/RiskDonut'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useAnalyzeScan, usePatientScans } from '../../hooks/useDoctorPatients'
import { usePatientProfile } from '../../hooks/usePatientProfile'
import { formatDate } from '../../lib/format'

const statusTone = { pending: 'amber', analyzing: 'blue', done: 'teal', failed: 'rose' } as const
const statusLabel = { pending: 'En attente', analyzing: 'Analyse en cours', done: 'Analysée', failed: 'Échec' } as const

const fileName = (path: string) => decodeURIComponent(path.split('/').pop() ?? '')

export const DoctorPatientDetail = () => {
  const patientId = Number(useParams().id)
  const { data: patient } = usePatientProfile(patientId)
  const { data: scans = [], isLoading, isError, error, refetch } = usePatientScans(patientId)
  const analyze = useAnalyzeScan(patientId)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selected = scans.find((s) => s.id === selectedId) ?? scans[0] ?? null

  const score = selected?.risk_score ?? null
  const high = score !== null && score >= 0.6

  return (
    <AppShell>
      <Link to="/doctor/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft size={14} /> Retour aux patients
      </Link>

      <section className="mb-5">
        <h1 className="text-2xl font-semibold text-text">{patient?.pseudonym ?? 'Patient'}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {patient?.user_email} • Naissance : {patient?.birth_date ? formatDate(patient.birth_date) : '—'}
        </p>
      </section>

      {/* 🧠 Bloc analyse */}
      <Card title="Analyse Deep Learning" className="mb-4">
        <p className="mb-4 text-sm text-text-muted">
          Analyse automatique d’une IRM cérébrale pour prédire le risque d’évolution de la maladie d’Alzheimer.
        </p>

        {!selected && <EmptyState title="Aucune IRM" description="Ce patient n’a pas encore envoyé d’IRM." />}

        {selected && (
          <>
            {/* 📄 IRM qui sera analysée */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-surface-soft p-3 text-sm">
              <Brain size={16} />
              <span className="text-text-muted">IRM à analyser :</span>
              <span className="font-semibold text-text">{fileName(selected.file)}</span>
              {selected.id === scans[0]?.id && <Badge tone="blue">Plus récente</Badge>}
              <Badge tone={statusTone[selected.status]}>{statusLabel[selected.status]}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center gap-3">
                {score !== null ? (
                  <>
                    <RiskDonut value={score} />
                    {high && (
                      <Badge tone="rose">
                        <AlertTriangle size={12} className="mr-1 inline" />
                        Évolution à surveiller
                      </Badge>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-muted">Pas encore de résultat pour cette IRM.</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-text-muted">Confiance du modèle</p>
                <p className="text-3xl font-bold text-text">
                  {selected.confidence !== null ? `${(selected.confidence * 100).toFixed(0)}%` : '—'}
                </p>
                <div className="h-2 w-full rounded bg-surface-soft">
                  <div
                    className="h-2 rounded bg-brand-teal"
                    style={{ width: `${(selected.confidence ?? 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-text-soft">Modèle : {selected.model_version || '3D-CNN'}</p>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <Button
                  onClick={() => analyze.mutate(selected.id)}
                  disabled={analyze.isPending || selected.status === 'analyzing'}
                >
                  <Brain size={16} className="mr-2 inline" />
                  {analyze.isPending ? 'Analyse en cours…' : 'Analyser cette IRM'}
                </Button>
                {analyze.isError && (
                  <p className="text-sm text-brand-rose" role="alert">
                    {analyze.error.message}
                  </p>
                )}
                <p className="text-xs text-text-soft">Envoyée le {formatDate(selected.uploaded_at)}</p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 📁 Liste des IRM du patient */}
      <Card title="IRM du patient">
        {isLoading && <Skeleton className="h-28 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
        <ul className="space-y-2">
          {scans.map((scan) => (
            <li key={scan.id}>
              <button
                type="button"
                onClick={() => setSelectedId(scan.id)}
                className={`flex w-full items-center justify-between rounded-md p-3 text-left text-sm ${
                  selected?.id === scan.id ? 'border border-brand-blue bg-brand-blue-soft' : 'bg-surface-soft'
                }`}
              >
                <div>
                  <p className="font-semibold text-text">{fileName(scan.file)}</p>
                  <p className="text-text-muted">{formatDate(scan.uploaded_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {scan.risk_score !== null && (
                    <span className="font-semibold">{(scan.risk_score * 100).toFixed(0)}%</span>
                  )}
                  <Badge tone={statusTone[scan.status]}>{statusLabel[scan.status]}</Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  )
}