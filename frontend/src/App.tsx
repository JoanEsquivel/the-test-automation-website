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
const DynamicPage = lazy(() => import('@/pages/playground/DynamicPage'))
const FramesPage = lazy(() => import('@/pages/playground/FramesPage'))
const ShadowPage = lazy(() => import('@/pages/playground/ShadowPage'))
const WindowsPage = lazy(() => import('@/pages/playground/WindowsPage'))
const FilesPage = lazy(() => import('@/pages/playground/FilesPage'))
const InteractionsPage = lazy(() => import('@/pages/playground/InteractionsPage'))
const InnerFormPage = lazy(() => import('@/pages/frames/InnerFormPage'))
const OuterFramePage = lazy(() => import('@/pages/frames/OuterFramePage'))
const FrameResultPage = lazy(() => import('@/pages/frames/FrameResultPage'))
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
          <Route path="playground/dynamic" element={<DynamicPage />} />
          <Route path="playground/frames" element={<FramesPage />} />
          <Route path="playground/shadow" element={<ShadowPage />} />
          <Route path="playground/windows" element={<WindowsPage />} />
          <Route path="playground/files" element={<FilesPage />} />
          <Route path="playground/interactions" element={<InteractionsPage />} />
          <Route path="shop" element={<ShopIntroPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Bare pages embedded by iframes / opened as popups — no app chrome. */}
        <Route path="frames" element={<BareLayout />}>
          <Route path="inner-form" element={<InnerFormPage />} />
          <Route path="outer" element={<OuterFramePage />} />
          <Route path="result" element={<FrameResultPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
