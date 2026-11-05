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
    className="mri-fade-up mb-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border px-6 py-5 shadow-soft"
    style={{ background: 'linear-gradient(110deg, #eff6ff 0%, #f0fdfa 55%, #ffffff 100%)' }}
  >
    <div className="flex items-center gap-4">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #60a5fa, #14b8a6)' }}
      >
        <Icon size={26} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
    </div>
    {right}
  </section>
)