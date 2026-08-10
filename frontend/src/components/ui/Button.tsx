import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  primary:
    'bg-volt-500 text-ink-950 hover:bg-volt-400 disabled:bg-ink-600 disabled:text-mist-500 font-semibold',
  secondary:
    'bg-ink-700 text-mist-100 hover:bg-ink-600 border border-ink-600 disabled:text-mist-500 font-medium',
  ghost: 'bg-transparent text-mist-300 hover:bg-ink-800 hover:text-mist-50 font-medium',
  danger: 'bg-red-500/90 text-white hover:bg-red-400 disabled:bg-ink-600 font-semibold',
} as const

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
}
