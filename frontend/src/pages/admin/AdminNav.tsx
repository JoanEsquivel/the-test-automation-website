import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/admin', end: true, label: 'Dashboard', testId: 'admin-nav-dashboard' },
  { to: '/admin/products', end: false, label: 'Products', testId: 'admin-nav-products' },
  { to: '/admin/orders', end: false, label: 'Orders', testId: 'admin-nav-orders' },
]

/** Sub-navigation shared by the three admin screens. The active item carries
 * `aria-current="page"` so assistive tech — and locators — can find it. */
export function AdminNav() {
  return (
    <nav aria-label="Admin sections" data-testid="admin-nav" className="flex flex-wrap gap-2">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          data-testid={item.testId}
          className={({ isActive }) =>
            `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-pulse-500/40 bg-pulse-500/15 text-pulse-300'
                : 'border-ink-700 bg-ink-900 text-mist-300 hover:bg-ink-800 hover:text-mist-50'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
