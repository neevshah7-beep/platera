import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { signOut } from '../login/actions'

export const metadata: Metadata = { title: { default: 'Shop admin', template: '%s · Shop admin' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Today', owner: false },
  { href: '/admin/orders', label: 'Orders', owner: false },
  { href: '/admin/appointments', label: 'Appointments', owner: false },
  { href: '/admin/enquiries', label: 'Enquiries', owner: false },
  { href: '/admin/services', label: 'Repairs & services', owner: false },
  { href: '/admin/products', label: 'Pieces', owner: true },
  { href: '/admin/rates', label: 'Rate history', owner: true },
  { href: '/admin/settings', label: 'Settings', owner: true },
  { href: '/admin/team', label: 'Team', owner: true },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const nav = NAV.filter((n) => !n.owner || user.role === 'OWNER')
  return (
    <div className="ground-light min-h-dvh">
      <header className="border-b border-rule-light">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-[var(--gutter)] py-4">
          <Link href="/admin" className="font-display text-step-2">Platera <span className="text-ink-light-muted">· shop</span></Link>
          <div className="flex items-center gap-5 text-step--1">
            <Link href="/" target="_blank" className="link">View the website</Link>
            <span className="text-ink-light-muted">{user.name}</span>
            <form action={signOut}><button className="link">Sign out</button></form>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto max-w-[1280px] overflow-x-auto px-[var(--gutter)]">
          <ul className="flex gap-6 whitespace-nowrap pb-3 text-step--1">
            {nav.map((n) => (
              <li key={n.href}><Link href={n.href} className="text-ink-light-muted hover:text-ink-light">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-[1280px] px-[var(--gutter)] py-10">{children}</main>
    </div>
  )
}
