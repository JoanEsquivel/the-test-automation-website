import type { ReactNode } from 'react'

const TONES = {
  info: 'border-volt-500/40 bg-volt-500/10 text-volt-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  danger: 'border-red-500/40 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
} as const

interface BannerProps {
  tone?: keyof typeof TONES
  children: ReactNode
  onDismiss?: () => void
  'data-testid'?: string
}

export function Banner({ tone = 'info', children, onDismiss, ...rest }: BannerProps) {
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`} {...rest}>
      <div className="flex-1 leading-relaxed">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 rounded p-0.5 text-current opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
