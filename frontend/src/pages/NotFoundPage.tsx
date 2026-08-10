import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div data-testid="not-found" className="py-20 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="font-display mt-4 text-2xl font-bold">This page does not exist</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist-400">
        Still useful. Point your broken-link check here and assert on the{' '}
        <code className="rounded bg-ink-800 px-1 py-0.5 text-xs text-mist-200">not-found</code> test id.
      </p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-volt-500 px-5 py-2.5 font-semibold text-ink-950 hover:bg-volt-400">
        Back to home
      </Link>
    </div>
  )
}
