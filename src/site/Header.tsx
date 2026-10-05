import Link from 'next/link'
import { MobileMenu } from '@/components/site/MobileMenu'
import { BagCount } from './BagCount'
import { HomeLink } from './HomeLink'

const NAV = [
  { href: '/collection', label: 'Collection' },
  { href: '/necklaces', label: 'Necklaces' },
  { href: '/earrings', label: 'Earrings' },
  { href: '/payals', label: 'Payals' },
  { href: '/mangalsutras', label: 'Bridal' },
]

/** Quiet, transparent, always above the scenes. The house name is the only ornament. */
export function Header({ bagCount }: { bagCount: number }) {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-[var(--gutter)]">
        <Link href="/" className="site-brand font-display text-[1.45rem] tracking-[0.06em]">PLATERA</Link>
        <nav aria-label="Collections" className="hidden gap-8 text-step--1 tracking-[0.08em] uppercase md:flex">
          <HomeLink className="link-underline" />
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link-underline">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-6 text-step--1 tracking-[0.08em] uppercase">
          <HomeLink className="link-underline md:hidden" />
          <Link href="/visit" className="link-underline hidden sm:inline">Visit</Link>
          <span className="md:hidden"><MobileMenu /></span>
          <Link href="/bag" className="bag-link" data-bag-target aria-label={`Bag, ${bagCount} ${bagCount === 1 ? 'piece' : 'pieces'}`}>
            {/* A shopping bag drawn in the house line: a soft body and a looped handle. */}
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden className="bag-icon">
              <path d="M5.2 8.2h13.6l-1 11.3a1.6 1.6 0 0 1-1.6 1.5H7.8a1.6 1.6 0 0 1-1.6-1.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8.8 10.4V7a3.2 3.2 0 0 1 6.4 0v3.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <BagCount initial={bagCount} />
          </Link>
        </div>
      </div>
    </header>
  )
}
