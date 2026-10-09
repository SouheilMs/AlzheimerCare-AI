import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  action?: ReactNode
}

export const Card = ({ title, action, className, children, ...props }: CardProps) => (
  <section
    className={cn('rounded-lg border bg-surface p-5 shadow-card', className)}
    {...props}
  >
    {(title || action) && (
      <header className="mb-4 flex items-center justify-between gap-2">
        {title ? <h2 className="text-base font-semibold text-text">{title}</h2> : <span />}
        {action}
      </header>
    )}
    {children}
  </section>
)
