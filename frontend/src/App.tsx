import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import AppLayout from '@/layouts/AppLayout'
import BareLayout from '@/layouts/BareLayout'
import HomePage from '@/pages/HomePage'

// Route-level code splitting: each area loads on demand (performance requirement).
const PlaygroundHubPage = lazy(() => import('@/pages/playground/PlaygroundHubPage'))
const FormsPage = lazy(() => import('@/pages/playground/FormsPage'))
const DropdownsPage = lazy(() => import('@/pages/playground/DropdownsPage'))
const PickersPage = lazy(() => import('@/pages/playground/PickersPage'))
const TablesPage = lazy(() => import('@/pages/playground/TablesPage'))
const ModalsPage = lazy(() => import('@/pages/playground/ModalsPage'))
const NavigationPage = lazy(() => import('@/pages/playground/NavigationPage'))
const ShopIntroPage = lazy(() => import('@/pages/shop/ShopIntroPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="py-20 text-center text-sm text-mist-400">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="playground" element={<PlaygroundHubPage />} />
          <Route path="playground/forms" element={<FormsPage />} />
          <Route path="playground/dropdowns" element={<DropdownsPage />} />
          <Route path="playground/pickers" element={<PickersPage />} />
          <Route path="playground/tables" element={<TablesPage />} />
          <Route path="playground/modals" element={<ModalsPage />} />
          <Route path="playground/navigation" element={<NavigationPage />} />
          <Route path="shop" element={<ShopIntroPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="frames" element={<BareLayout />}>
          {/* /frames/* bare pages are added in the structural-challenges phase */}
        </Route>
      </Routes>
    </Suspense>
  )
}
