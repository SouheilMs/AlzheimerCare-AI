import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Layers,
  MessageSquareText,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnalysisLoader } from '../../components/doctor/mri/AnalysisLoader'
import { AnimatedBar } from '../../components/doctor/mri/AnimatedBar'
import { AnimatedRiskRing } from '../../components/doctor/mri/AnimatedRiskRing'
import { delayStyle, useCountUp } from '../../components/doctor/mri/motion'
import { riskColor, riskHint, riskLabel, riskLevel } from '../../components/doctor/mri/risk'
import { RiskTrend } from '../../components/doctor/mri/RiskTrend'
import { ScanViewer } from '../../components/doctor/mri/ScanViewer'
import { StatTile } from '../../components/doctor/mri/StatTile'
import '../../components/doctor/mri/mri.css'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useAnalyzeScan, usePatientScans } from '../../hooks/useDoctorPatients'
import { usePatientProfile } from '../../hooks/usePatientProfile'
import { formatDate } from '../../lib/format'
import { usePatientConsultations } from '../../hooks/useConsultation'
import { PageHero } from '../../components/ui/PageHero'
import { Avatar } from '../../components/ui/Avatar'
const statusTone = { pending: 'amber', analyzing: 'blue', done: 'teal', failed: 'rose' } as const
const statusLabel = { pending: 'En attente', analyzing: 'Analyse en cours', done: 'Analysée', failed: 'Échec' } as const

// Durée minimale de l'attente affichée avant le résultat (effet « suspense »)
const MIN_SUSPENSE_MS = 4200

const fileName = (path: string) => decodeURIComponent(path.split('/').pop() ?? '')

const ConfidenceValue = ({ value }: { value: number }) => {
  const counted = useCountUp(value * 100, 1200)
  return <span className="tabular-nums">{Math.round(counted)}%</span>
}

export const DoctorPatientDetail = () => {
  const patientId = Number(useParams().id)
  const { data: patient } = usePatientProfile(patientId)
  const { data: scans = [], isLoading, isError, error, refetch } = usePatientScans(patientId)
  const analyze = useAnalyzeScan(patientId)
  const { data: consultations = [] } = usePatientConsultations(patientId)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [revealKey, setRevealKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selected = scans.find((s) => s.id === selectedId) ?? scans[0] ?? null
  const score = selected?.risk_score ?? null
  const level = riskLevel(score)
  const color = riskColor[level]

  const pendingCount = scans.filter((s) => s.status === 'pending').length
  const analysedScans = scans.filter((s) => s.risk_score !== null)
  const lastAnalysed = scans.find((s) => s.status === 'done' && s.analyzed_at)

  const runAnalysis = async () => {
    if (!selected) return
    setErrorMessage(null)
    setAnalyzing(true)
    const suspense = new Promise<void>((resolve) => window.setTimeout(resolve, MIN_SUSPENSE_MS))
    try {
      await Promise.all([analyze.mutateAsync(selected.id), suspense])
      setRevealKey((k) => k + 1)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'L’analyse a échoué. Veuillez réessayer.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <AppShell>
      <Link to="/doctor/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft size={14} /> Retour aux patients
      </Link>

           <PageHero
        icon={Brain}
        title={patient?.pseudonym ?? 'Patient'}
        subtitle={`${patient?.user_email ?? ''} • Naissance : ${patient?.birth_date ? formatDate(patient.birth_date) : '—'}`}
        right={
          <div className="flex items-center gap-3">
            <Avatar name={patient?.user_email ?? 'Patient'} size={44} />
            <Badge tone="blue">
              <Brain size={12} className="mr-1 inline" />
              {scans.length} IRM
            </Badge>
          </div>
        }
      />

      {/* 🧠 Bloc analyse */}
      <section
        className="mri-fade-up mb-4 overflow-hidden rounded-lg border bg-surface shadow-soft"
        style={delayStyle(80)}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
          style={{ background: 'linear-gradient(90deg, #eff6ff 0%, transparent 70%)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)' }}
            >
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Analyse Deep Learning</h2>
              <p className="text-sm text-text-muted">
                Analyse automatique d’une IRM cérébrale pour prédire le risque d’évolution de la maladie d’Alzheimer.
              </p>
            </div>
          </div>
          {selected && (
            <div className="rounded-md border bg-surface px-3 py-1.5 text-xs text-text-muted">
              Modèle : <span className="font-semibold text-text">{selected.model_version || 'Deep Learning'}</span>
            </div>
          )}
        </div>

        <div className="p-5">
          {!selected && <EmptyState title="Aucune IRM" description="Ce patient n’a pas encore envoyé d’IRM." />}

          {selected && (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md bg-surface-soft p-3 text-sm">
                <FileText size={16} />
                <span className="text-text-muted">IRM à analyser :</span>
                <span className="font-semibold text-text">{fileName(selected.file)}</span>
                {selected.id === scans[0]?.id && <Badge tone="blue">Plus récente</Badge>}
                <Badge tone={statusTone[selected.status]}>{statusLabel[selected.status]}</Badge>
              </div>

              {analyzing ? (
                <AnalysisLoader fileName={fileName(selected.file)} />
              ) : (
                <div key={`${selected.id}-${score}-${revealKey}`} className="mri-fade-up">
                  <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
                    <ScanViewer fileName={fileName(selected.file)} />

                    <div className="flex flex-col items-center gap-3">
                      {score !== null ? (
                        <>
                          <AnimatedRiskRing value={score} />
                          {level === 'high' && (
                            <Badge tone="rose">
                              <AlertTriangle size={12} className="mr-1 inline" />
                              Évolution à surveiller
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed text-center">
                          <Clock3 size={26} className="text-text-soft" />
                          <p className="px-6 text-sm text-text-muted">Pas encore de résultat pour cette IRM.</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-text-muted">Cohérence entre coupes</p>                        <p className="mb-2 text-3xl font-bold text-text">
                          {selected.confidence !== null ? <ConfidenceValue value={selected.confidence} /> : '—'}
                        </p>
                        <AnimatedBar value={selected.confidence ?? 0} color="#14b8a6" />
                      </div>

                      <Button onClick={() => void runAnalysis()} disabled={analyzing || selected.status === 'analyzing'}>
                        <Brain size={16} className="mr-2 inline" />
                        {score !== null ? 'Relancer l’analyse' : 'Analyser cette IRM'}
                      </Button>
                      {errorMessage && (
                        <p className="text-sm text-brand-rose" role="alert">
                          {errorMessage}
                        </p>
                      )}
                      <p className="text-xs text-text-soft">Envoyée le {formatDate(selected.uploaded_at)}</p>
                    </div>
                  </div>

                  <div
                    className="mt-5 flex items-start gap-3 rounded-md px-4 py-3 text-sm"
                    style={{ backgroundColor: `${color}14`, borderLeft: `4px solid ${color}` }}
                  >
                    <Info size={18} className="mt-0.5 shrink-0" style={{ color }} />
                    <div>
                      <p className="font-semibold" style={{ color }}>
                        {riskLabel[level]}
                      </p>
                      <p className="text-text-muted">{riskHint[level]}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 📊 Résumé */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Layers} label="IRM reçues" value={scans.length} delay={120} />
        <StatTile icon={Clock3} label="À analyser" value={pendingCount} color="#f59e0b" delay={200} />
        <StatTile icon={CheckCircle2} label="Analysées" value={analysedScans.length} color="#14b8a6" delay={280} />
        <StatTile
          icon={CalendarClock}
          label="Dernière analyse"
          value={lastAnalysed?.analyzed_at ? formatDate(lastAnalysed.analyzed_at) : '—'}
          color="#6366f1"
          delay={360}
        />
      </div>

      {/* 📈 Évolution + lecture */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Évolution du risque estimé" className="xl:col-span-2">
          <RiskTrend scans={scans} />
          <p className="mt-2 text-xs text-text-soft">
            Chaque point correspond à une IRM analysée. Lignes pointillées : seuils de 40 % et 60 %.
          </p>
        </Card>

        <Card title="Comment lire ce résultat ?">
          <ul className="space-y-3 text-sm">
            {(
              [
                ['low', 'Moins de 40 %', 'Peu de signes d’évolution détectés par le modèle.'],
                ['moderate', '40 à 60 %', 'Risque intermédiaire : surveillance rapprochée conseillée.'],
                ['high', '60 % et plus', 'Risque élevé de progression : relecture clinique recommandée.'],
              ] as const
            ).map(([lvl, range, text]) => (
              <li key={lvl} className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: riskColor[lvl] }} />
                <div>
                  <p className="font-semibold text-text">{range}</p>
                  <p className="text-text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md bg-surface-soft p-3 text-xs text-text-muted">
          La cohérence indique la proportion de coupes de l’IRM dont la prédiction va dans le même sens que le
résultat global (100 % = toutes les coupes concordent). Ce n’est pas une probabilité d’exactitude. Ce
résultat est une aide à la décision : il doit être validé par le médecin et ne remplace pas un diagnostic.
          </p>
        </Card>
      </div>
<Card title="Consultations précédentes" className="mb-4">
  {consultations.length === 0 ? (
    <p className="text-sm text-text-soft">Aucune consultation terminée pour ce patient.</p>
  ) : (
    <ul className="space-y-2">
      {consultations.map((c) => (
        <li key={c.appointment_id}>
          <Link
            to={`/doctor/consultations/${c.appointment_id}/report`}
            className="block rounded-md bg-surface-soft p-3 text-sm transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-semibold text-text">
                <MessageSquareText size={14} />
                {formatDate(c.starts_at)}
              </p>
              <Badge tone={c.validated ? 'teal' : 'amber'}>{c.validated ? 'Validée' : 'À valider'}</Badge>
            </div>
            <p className="mt-1 text-text-muted">{c.motif || 'Motif non renseigné'}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {c.mots_cles.slice(0, 6).map((k) => (
                <Badge key={k} tone="blue">{k}</Badge>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )}
</Card>
      {/* 📁 Liste des IRM du patient */}
      <Card title="IRM du patient">
        {isLoading && <Skeleton className="h-28 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
        <ul className="space-y-2">
          {scans.map((scan, index) => {
            const scanColor = riskColor[riskLevel(scan.risk_score)]
            return (
              <li key={scan.id} className="mri-fade-up" style={delayStyle(index * 70)}>
                <button
                  type="button"
                  onClick={() => setSelectedId(scan.id)}
                  className={`flex w-full items-center justify-between rounded-md p-3 text-left text-sm transition hover:-translate-y-0.5 ${
                    selected?.id === scan.id ? 'border border-brand-blue bg-brand-blue-soft' : 'bg-surface-soft'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-1 rounded-full" style={{ backgroundColor: scanColor }} />
                    <div>
                      <p className="font-semibold text-text">{fileName(scan.file)}</p>
                      <p className="text-text-muted">{formatDate(scan.uploaded_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.risk_score !== null && (
                      <span className="font-semibold" style={{ color: scanColor }}>
                        {(scan.risk_score * 100).toFixed(0)}%
                      </span>
                    )}
                    <Badge tone={statusTone[scan.status]}>{statusLabel[scan.status]}</Badge>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </AppShell>
  )
}
