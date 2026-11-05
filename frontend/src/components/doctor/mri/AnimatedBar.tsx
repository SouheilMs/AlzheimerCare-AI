import { useEffect, useState } from 'react'

export const AnimatedBar = ({ value, color }: { value: number; color: string }) => {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(Math.max(0, Math.min(1, value))))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-soft">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width * 100}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: 'width 1.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}
