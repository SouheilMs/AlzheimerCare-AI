import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  ListChecks,
  Pencil,
  Sparkles,
  Target,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ConsultationSummary } from '../../api/consultationsApi'
import { delayStyle } from '../../components/doctor/mri/motion'
import '../../components/doctor/mri/mri.css'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, Skeleton, WidgetError } from '../../components/ui'
import { PageHero } from '../../components/ui/PageHero'
import { useConsultationReport, useSaveReport, useValidateReport } from '../../hooks/useConsultation'

type ListKey = 'symptomes' | 'resultats_discutes' | 'actions_proposees' | 'points_incertains' | 'mots_cles'

const COLUMNS: Array<{ key: ListKey; label: string; icon: LucideIcon; color: string; bg: string }> = [
  { key: 'symptomes', label: 'Symptômes mentionnés', icon: ListChecks, color: '#0d9488', bg: '#f0fdfa' },
  { key: 'resultats_discutes', label: 'Résultats discutés', icon: BarChart3, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'actions_proposees', label: 'Actions proposées', icon: Target, color: '#ea580c', bg: '#fff7ed' },
]

const ALL_LISTS: ListKey[] = ['symptomes', 'resultats_discutes', 'actions_proposees', 'points_incertains', 'mots_cles']

const fmt = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Tunis',
      }).format(new Date(iso))
    : '—'

const ColumnShell = ({
  label,
  icon: Icon,
  color,
  bg,
  delay,
  children,
}: {
  label: string
  icon: LucideIcon
  color: string
  bg: string
  delay: number
  children: React.ReactNode
}) => (
  <div
    className="mri-fade-up overflow-hidden rounded-2xl border bg-surface shadow-soft transition hover:-translate-y-1"
    style={delayStyle(delay)}
  >
    <div className="h-1.5" style={{ backgroundColor: color }} />
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: bg, color }}>
          <Icon size={18} />
        </span>
        <h3 className="text-sm font-bold" style={{ color }}>
          {label}
        </h3>
      </div>
      {children}
    </div>
  </div>
)

export const ConsultationReport = () => {
  const appointmentId = Number(useParams().appointmentId)
  const { data, isLoading, isError, error, refetch } = useConsultationReport(appointmentId)
  const save = useSaveReport(appointmentId)
  const validate = useValidateReport(appointmentId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ConsultationSummary>({})
  const [tab, setTab] = useState<'traduction' | 'transcription'>('traduction')

  const summary = data?.summary ?? {}
  const ready = Object.keys(summary).length > 0

  const startEdit = () => {
    setDraft(summary)
    setEditing(true)
  }

  const setList = (key: ListKey, text: string) => setDraft({ ...draft, [key]: text.split('\n') })

  const onSave = () => {
    const clean: ConsultationSummary = { ...draft }
    for (const k of ALL_LISTS) {
      clean[k] = (draft[k] ?? []).map((s) => s.trim()).filter(Boolean)
    }
    save.mutate(clean, { onSuccess: () => setEditing(false) })
  }

  const textareaClass = 'w-full rounded-lg border bg-white p-2 text-sm'

  return (
    <AppShell>
      <Link to="/doctor/appointments" className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft size={14} /> Retour aux rendez-vous
      </Link>

      <PageHero
        icon={FileText}
        title="Fiche de consultation"
        subtitle={data ? `${data.patient} · ${fmt(data.started_at ?? data.starts_at)}` : ''}
        right={
          data?.validated_at ? (
            <Badge tone="teal">
              <CheckCircle2 size={12} className="mr-1 inline" />
              Validée
            </Badge>
          ) : (
            <Badge tone="amber">À valider</Badge>
          )
        }
      />

      {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
      {isLoading && <Skeleton className="h-40 w-full" />}

      {data && !ready && !data.transcript.trim() && data.status === 'ended' && (
        <Card title="Aucune transcription">
          <p className="text-sm text-text-muted">Aucune parole n’a été transcrite : il n’y a pas de fiche à générer.</p>
        </Card>
      )}

      {data && !ready && (data.transcript.trim() || data.status !== 'ended') && (
        <Card title="Génération en cours…">
          <p className="flex items-center gap-2 text-sm text-text-muted">
            <Sparkles size={16} className="text-brand-blue" />
            L’IA prépare la fiche. Cela peut prendre quelques minutes, la page se met à jour toute seule.
          </p>
        </Card>
      )}

      {ready && summary.error && (
        <WidgetError message={`La génération a échoué : ${summary.error}`} onRetry={() => void refetch()} />
      )}

      {ready && !summary.error && (
        <div className="space-y-4">
          <div
            className="mri-fade-up flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: '#99f6e4', backgroundColor: '#f0fdfa' }}
          >
            <Sparkles size={18} className="mt-0.5 shrink-0" style={{ color: '#0d9488' }} />
            <p className="text-text-muted">
              <span className="font-semibold text-text">Résumé proposé par l’agent.</span> Généré à partir d’une
              transcription automatique (français / derja). Relisez, corrigez et validez : cette fiche ne remplace pas
              votre jugement clinique.
            </p>
          </div>

          {/* Mots-clés */}
          <div className="mri-fade-up rounded-2xl border bg-surface p-4 shadow-soft" style={delayStyle(60)}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">Mots-clés</p>
            {editing ? (
              <textarea
                className={textareaClass}
                rows={3}
                value={(draft.mots_cles ?? []).join('\n')}
                onChange={(e) => setList('mots_cles', e.target.value)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(summary.mots_cles ?? []).map((k) => (
                  <span
                    key={k}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4 colonnes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ColumnShell label="Motif de consultation" icon={ClipboardList} color="#2563eb" bg="#eff6ff" delay={100}>
              {editing ? (
                <textarea
                  className={textareaClass}
                  rows={5}
                  value={draft.motif ?? ''}
                  onChange={(e) => setDraft({ ...draft, motif: e.target.value })}
                />
              ) : (
                <p className="text-sm text-text">{summary.motif || '—'}</p>
              )}
            </ColumnShell>

            {COLUMNS.map(({ key, label, icon, color, bg }, i) => (
              <ColumnShell key={key} label={label} icon={icon} color={color} bg={bg} delay={160 + i * 60}>
                {editing ? (
                  <textarea
                    className={textareaClass}
                    rows={6}
                    value={(draft[key] ?? []).join('\n')}
                    onChange={(e) => setList(key, e.target.value)}
                  />
                ) : (summary[key] ?? []).length === 0 ? (
                  <p className="text-sm text-text-soft">Aucun élément</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-text">
                    {(summary[key] ?? []).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </ColumnShell>
            ))}
          </div>

          {/* Points à vérifier */}
          {(editing || (summary.points_incertains ?? []).length > 0) && (
            <div
              className="mri-fade-up rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
            >
              <p className="mb-2 flex items-center gap-2 font-semibold" style={{ color: '#b45309' }}>
                <TriangleAlert size={16} /> Points à vérifier
              </p>
              {editing ? (
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={(draft.points_incertains ?? []).join('\n')}
                  onChange={(e) => setList('points_incertains', e.target.value)}
                />
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-text">
                  {(summary.points_incertains ?? []).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Texte source */}
          <div className="rounded-2xl border bg-surface p-4 shadow-soft">
            <div className="mb-3 flex gap-2">
              {(['traduction', 'transcription'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    tab === t ? 'border-brand-blue bg-brand-blue-soft text-brand-blue' : 'bg-surface text-text-muted'
                  }`}
                >
                  {t === 'traduction' ? 'Traduction française' : 'Transcription brute'}
                </button>
              ))}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-text-muted" dir="auto">
              {tab === 'traduction' ? summary.traduction || '—' : data?.transcript || '—'}
            </pre>
          </div>

          {/* Boutons */}
          <div className="flex flex-wrap justify-end gap-2">
            {editing ? (
              <>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={onSave} disabled={save.isPending}>
                  {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={startEdit}>
                  <Pencil size={16} className="mr-2 inline" />
                  Modifier
                </Button>
                <Button onClick={() => validate.mutate()} disabled={validate.isPending || !!data?.validated_at}>
                  <CheckCircle2 size={16} className="mr-2 inline" />
                  {data?.validated_at ? 'Rapport validé' : 'Valider le rapport'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}