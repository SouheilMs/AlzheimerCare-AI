import { Brain, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

// Étapes affichées pendant l'attente (animation visuelle, pas une progression en direct du serveur).
const STEPS = [
  'Lecture des coupes IRM',
  'Prétraitement et normalisation',
  'Inférence du modèle Deep Learning',
  'Calcul du score de risque',
]

interface AnalysisLoaderProps {
  fileName: string
  stepMs?: number
}

export const AnalysisLoader = ({ fileName, stepMs = 1050 }: AnalysisLoaderProps) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), stepMs)
    return () => window.clearInterval(id)
  }, [stepMs])

  const progress = Math.round(((step + 0.6) / STEPS.length) * 100)

  return (
    <div
      role="status"
      aria-live="polite"
      className="mri-fade-up flex flex-col items-center gap-5 rounded-lg px-4 py-8"
      style={{ background: 'radial-gradient(circle at 50% 0%, #eff6ff 0%, transparent 70%)' }}
    >
      <div className="relative h-36 w-36">
        <span
          className="mri-spin absolute inset-0 rounded-full border-2 border-dashed"
          style={{ borderColor: '#93c5fd' }}
        />
        <span
          className="mri-spin-rev absolute inset-3 rounded-full border-2"
          style={{ borderColor: '#2563eb transparent #2563eb transparent' }}
        />
        <span className="absolute inset-7 flex items-center justify-center rounded-full bg-surface shadow-soft">
          <Brain size={44} className="mri-brain" style={{ color: '#2563eb' }} />
        </span>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-text">Analyse en cours…</p>
        <p className="mt-1 max-w-xs truncate text-sm text-text-muted">{fileName}</p>
      </div>

      <ul className="w-full max-w-sm space-y-2 text-sm">
        {STEPS.map((label, index) => {
          const done = index < step
          const current = index === step
          return (
            <li
              key={label}
              className={`flex items-center gap-2 transition-opacity duration-500 ${
                index > step ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: done ? '#14b8a6' : current ? '#2563eb' : '#cbd5e1' }}
              >
                {done ? <Check size={12} /> : current ? <Loader2 size={12} className="mri-spin" /> : null}
              </span>
              <span className={current ? 'font-semibold text-text' : 'text-text-muted'}>{label}</span>
            </li>
          )
        })}
      </ul>

      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-soft">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #60a5fa, #2563eb)',
            transition: 'width 0.9s ease',
          }}
        />
      </div>
      <p className="text-xs text-text-soft">Merci de patienter, le résultat va s’afficher.</p>
    </div>
  )
}
