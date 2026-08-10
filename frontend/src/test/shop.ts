/** Shared setup for store-UI tests: MSW node server running the REAL engine
 * handlers, plus client-state reset (localStorage, engine seeds, zustand stores).
 */

import { setupServer } from 'msw/node'

import { handlers } from '@/mocks/handlers'
import { resetAll } from '@/engine/store'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useModeStore } from '@/stores/mode'

export const server = setupServer(...handlers)

export function resetClientState(): void {
  localStorage.clear()
  resetAll()
  useAuthStore.setState({ token: null, user: null })
  useCartStore.setState({ cartId: null, itemCount: 0 })
  useModeStore.setState({ mode: 'browser', forced: false, fallback: false, fallbackDismissed: false })
}
