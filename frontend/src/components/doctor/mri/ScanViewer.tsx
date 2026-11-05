import { Brain } from 'lucide-react'

interface ScanViewerProps {
  fileName: string
  scanning?: boolean
}

/** Panneau « visionneuse » décoratif (le zip n'est pas décodé côté navigateur). */
export const ScanViewer = ({ fileName, scanning = false }: ScanViewerProps) => (
  <div
    className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-lg"
    style={{ background: 'radial-gradient(circle at 50% 45%, #1e293b 0%, #0b1220 75%)' }}
  >
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
    <Brain
      size={104}
      strokeWidth={1}
      className="absolute inset-0 m-auto"
      style={{ color: '#93c5fd', opacity: 0.85 }}
    />
    <span
      className={`${scanning ? 'mri-scanline' : 'mri-scanline-slow'} left-0 right-0 h-0.5`}
      style={{
        background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
        boxShadow: '0 0 12px #38bdf8',
      }}
    />
    <span className="absolute left-2 top-2 text-[10px] font-semibold text-sky-300">R</span>
    <span className="absolute right-2 top-2 text-[10px] font-semibold text-sky-300">L</span>
    <p className="absolute inset-x-2 bottom-2 truncate text-center text-[11px] text-sky-200">{fileName}</p>
  </div>
)
