import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import { Badge } from '@/components/ui/Badge'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { adoptUserCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/auth'
import { TextField } from './components/TextField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SEED_USERS = [
  {
    testId: 'fill-customer',
    role: 'Customer',
    tone: 'volt' as const,
    email: 'customer@example.com',
    password: 'Password123!',
    blurb: 'Shops, checks out and reviews products.',
  },
  {
    testId: 'fill-admin',
    role: 'Admin',
    tone: 'pulse' as const,
    email: 'admin@example.com',
    password: 'Admin123!',
    blurb: 'Everything above plus the /admin dashboard.',
  },
]

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const setSession = useAuthStore((state) => state.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const returnTo = params.get('returnTo') ?? '/'

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function fillWith(user: (typeof SEED_USERS)[number]) {
    setEmail(user.email)
    setPassword(user.password)
    setErrors({})
    setApiError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setApiError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const { token, user } = await api.auth.login({ email: email.trim(), password })
      setSession(token, user)
      await adoptUserCart()
      toast({ tone: 'success', message: `Welcome back, ${user.name}.` })
      navigate(returnTo, { replace: true })
    } catch (cause) {
      setApiError(errorMessage(cause, 'Login failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title="Log in"
        what="The store's authentication screen. It validates your input the same way the API does, then stores the session token used by every subsequent request."
        how="Use one of the seed accounts on the right (the “Use this account” buttons fill the form for you) or your own registered account. A ?returnTo= parameter in the URL is honored after a successful login."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form
          data-testid="login-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-ink-700 bg-ink-900 p-6"
        >
          {apiError && (
            <Banner tone="danger" data-testid="login-error">
              {apiError}
            </Banner>
          )}

          <TextField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />

          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />

          <Button type="submit" size="lg" className="w-full" data-testid="login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </Button>

          <p className="text-sm text-mist-400">
            No account yet?{' '}
            <Link
              to={`/account/register${params.get('returnTo') ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              data-testid="go-to-register"
              className="font-semibold text-volt-400 hover:underline"
            >
              Create one
            </Link>
            .
          </p>
        </form>

        <aside data-testid="seed-credentials" className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <h2 className="font-display text-base font-bold">Seed accounts</h2>
          <p className="mt-1 text-xs leading-relaxed text-mist-400">
            These exist in both API modes and are restored by “Reset demo data”.
          </p>
          <ul className="mt-4 space-y-4">
            {SEED_USERS.map((user) => (
              <li key={user.email} className="rounded-xl border border-ink-700 bg-ink-800/60 p-4">
                <Badge tone={user.tone}>{user.role}</Badge>
                <p className="mt-2 font-mono text-xs text-mist-200">{user.email}</p>
                <p className="font-mono text-xs text-mist-200">{user.password}</p>
                <p className="mt-1 text-xs text-mist-500">{user.blurb}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  data-testid={user.testId}
                  onClick={() => fillWith(user)}
                >
                  Use this account
                </Button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
