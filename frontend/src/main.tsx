import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { resolveMode } from '@/api/mode'
import { useModeStore } from '@/stores/mode'
import App from './App'
import './index.css'

/** Dual-mode bootstrap: resolve the mode BEFORE rendering so every request
 * from the very first render goes to the right server. */
async function bootstrap() {
  const resolution = await resolveMode()
  useModeStore.getState().initialize(resolution)

  if (resolution.mode === 'browser') {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest: 'bypass',
    })
  } else if ('serviceWorker' in navigator) {
    // Backend mode must never be shadowed by a stale MSW registration.
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()
