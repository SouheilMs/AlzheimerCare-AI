import { useEffect, useState, type CSSProperties } from 'react'

/** Délai d'apparition pour les animations en cascade (variable CSS --d). */
export const delayStyle = (ms: number): CSSProperties => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties

/** Compteur animé de 0 jusqu'à `target` (respecte prefers-reduced-motion). */
export const useCountUp = (target: number, duration = 1200): number => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
