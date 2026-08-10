import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { adoptUserCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/auth'
import { TextField } from './components/TextField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export default function RegisterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const setSession = useAuthStore((state) => state.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const returnTo = params.get('returnTo') ?? '/'

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 8 || !/\d/.test(password)) {
      next.password = 'Use at least 8 characters and include a digit.'
    }
    if (confirm !== password) next.confirm = 'The two passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setApiError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const { token, user } = await api.auth.register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      setSession(token, user)
      await adoptUserCart()
      toast({ tone: 'success', message: `Welcome, ${user.name}. Your account is ready.` })
      navigate(returnTo, { replace: true })
    } catch (cause) {
      setApiError(errorMessage(cause, 'Registration failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title="Create an account"
        what="Registration for the store. The form enforces exactly the rules the API enforces: a valid email, a name, and a password of at least 8 characters containing a digit."
        how="Fill the fields and submit. Registering an email that already exists (try customer@example.com) returns the EMAIL_TAKEN error in the banner — a reliable negative-path scenario."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form
          data-testid="register-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-ink-700 bg-ink-900 p-6"
        >
          {apiError && (
            <Banner tone="danger" data-testid="register-error">
              {apiError}
            </Banner>
          )}

          <TextField
            id="register-name"
            label="Full name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={setName}
            error={errors.name}
          />

          <TextField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />

          <TextField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters and at least one digit."
            value={password}
            onChange={setPassword}
            error={errors.password}
          />

          <TextField
            id="register-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
          />

          <Button type="submit" size="lg" className="w-full" data-testid="register-submit" disabled={submitting}>
            {submitting ? 'Creating your account…' : 'Create account'}
          </Button>

          <p className="text-sm text-mist-400">
            Already registered?{' '}
            <Link
              to={`/account/login${params.get('returnTo') ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              data-testid="go-to-login"
              className="font-semibold text-volt-400 hover:underline"
            >
              Log in instead
            </Link>
            .
          </p>
        </form>

        <aside className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <h2 className="font-display text-base font-bold">What happens on submit</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-mist-300">
            <li>
              <strong className="text-mist-100">201 Created</strong> — a token and your user object come
              back; the session is stored and any guest cart is merged into your account.
            </li>
            <li>
              <strong className="text-mist-100">400 VALIDATION_ERROR</strong> — the API rejects a weak
              password or a malformed email, even if you bypass the client-side checks.
            </li>
            <li>
              <strong className="text-mist-100">409 EMAIL_TAKEN</strong> — the email already belongs to
              an account.
            </li>
          </ul>
          <p className="mt-4 text-xs text-mist-500">
            New accounts always get the <code className="rounded bg-ink-800 px-1 py-0.5">customer</code>{' '}
            role. Use the seeded admin account to reach the admin area.
          </p>
        </aside>
      </div>
    </div>
  )
}
