import { Outlet } from 'react-router-dom'

/**
 * Chrome-less layout for /frames/* pages that get embedded inside iframes.
 * No header, no footer, no max-width: just the page content.
 */
export default function BareLayout() {
  return (
    <div className="min-h-screen bg-ink-950 p-6 text-mist-50">
      <Outlet />
    </div>
  )
}
