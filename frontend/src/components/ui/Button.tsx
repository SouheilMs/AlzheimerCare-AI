import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-indigo',
  secondary: 'bg-brand-blue-soft text-brand-blue hover:bg-surface-soft',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-soft',
}

export const Button = ({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'focus-ring rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
      variantClasses[variant],
      className,
    )}
    {...props}
  />
)
