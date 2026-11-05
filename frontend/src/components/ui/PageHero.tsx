import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  right?: ReactNode
}

export const PageHero = ({ icon: Icon, title, subtitle, right }: Props) => (
  <section
    className="mri-fade-up relative mb-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border px-6 py-6 shadow-soft"
    style={{ background: 'linear-gradient(110deg, #eff6ff 0%, #f0fdfa 55%, #ffffff 100%)' }}
  >
    <div
      className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full blur-2xl"
      style={{ background: 'rgba(147, 197, 253, 0.45)' }}
    />
    <div
      className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full blur-2xl"
      style={{ background: 'rgba(94, 234, 212, 0.4)' }}
    />

    <div className="relative flex items-center gap-4">
      <div
        className="mri-float flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #60a5fa, #14b8a6)' }}
      >
        <Icon size={30} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="relative">{right}</div>}
  </section>
)