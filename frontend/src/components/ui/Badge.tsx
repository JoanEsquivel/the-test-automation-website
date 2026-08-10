import type { ReactNode } from 'react'

const TONES = {
  volt: 'bg-volt-500/15 text-volt-300 border-volt-500/40',
  pulse: 'bg-pulse-500/15 text-pulse-300 border-pulse-500/40',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  danger: 'bg-red-500/15 text-red-300 border-red-500/40',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  neutral: 'bg-ink-700/60 text-mist-300 border-ink-600',
} as const

export type BadgeTone = keyof typeof TONES

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  'data-testid'?: string
}

export function Badge({ tone = 'neutral', children, className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
