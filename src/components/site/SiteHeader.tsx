import Link from 'next/link'
import { MobileMenu } from './MobileMenu'

export const NAV = [
  { href: '/necklaces', label: 'Necklaces' },
  { href: '/payals', label: 'Payals' },
  { href: '/earrings', label: 'Earrings' },
  { href: '/mangalsutras', label: 'Mangalsutras' },
  { href: '/visit', label: 'Visit the store' },
] as const

export function SiteHeader({ bagCount }: { bagCount: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-velvet/95 backdrop-blur-[2px] supports-[backdrop-filter]:bg-velvet/85">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-ivory focus:px-3 focus:py-2 focus:text-velvet">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-[var(--gutter)]">
        <Link href="/" className="font-display text-step-2 tracking-[-0.02em]" aria-label="Platera Jewellers, home">
          Platera
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-step--1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-muted transition-colors duration-[var(--dur-calm)] hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5 text-step--1">
          <Link href="/appointment" className="hidden text-ink-muted hover:text-ink sm:inline">
            Book a viewing
          </Link>
          <Link href="/bag" className="num" aria-label={`Bag, ${bagCount} ${bagCount === 1 ? 'piece' : 'pieces'}`}>
            Bag{bagCount > 0 ? ` (${bagCount})` : ''}
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
