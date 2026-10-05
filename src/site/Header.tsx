import Link from 'next/link'
import { MobileMenu } from '@/components/site/MobileMenu'
import { BagCount } from './BagCount'
import { HomeLink } from './HomeLink'
import { ScrollDirection } from './ScrollDirection'

const LEFT = [
  { href: '/collection', label: 'Collection' },
  { href: '/necklaces', label: 'Necklaces' },
  { href: '/earrings', label: 'Earrings' },
]
const RIGHT = [
  { href: '/payals', label: 'Payals' },
  { href: '/mangalsutras', label: 'Bridal' },
  { href: '/visit', label: 'Visit' },
]

/**
 * The house header, set like a jeweller's letterhead: the name at the centre in fine
 * spaced capitals, the rooms either side in small lettering, on frosted champagne glass
 * with a gold hairline beneath. Transparent over the homepage's opening scene.
 */
export function Header({ bagCount }: { bagCount: number }) {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-40">
      <ScrollDirection />
      <div className="site-header-row mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-[var(--gutter)]">
        <nav aria-label="Collections" className="site-nav hidden items-center gap-[clamp(1.2rem,0.4rem+1.4vw,2.4rem)] md:flex">
          <HomeLink className="link-underline" />
          {LEFT.map((n) => (
            <Link key={n.href} href={n.href} className="link-underline">{n.label}</Link>
          ))}
        </nav>
        <span className="md:hidden"><MobileMenu /></span>
        <Link href="/" className="site-brand font-display" aria-label="Platera, home">PLATERA</Link>
        <div className="site-nav flex items-center justify-end gap-[clamp(1.2rem,0.4rem+1.4vw,2.4rem)]">
          {RIGHT.map((n) => (
            <Link key={n.href} href={n.href} className="link-underline hidden md:inline">{n.label}</Link>
          ))}
          <Link href="/bag" className="bag-link" data-bag-target aria-label={`Bag, ${bagCount} ${bagCount === 1 ? 'piece' : 'pieces'}`}>
            {/* A shopping bag drawn in the house line: a soft body and a looped handle. */}
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden className="bag-icon">
              <path d="M5.2 8.2h13.6l-1 11.3a1.6 1.6 0 0 1-1.6 1.5H7.8a1.6 1.6 0 0 1-1.6-1.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M8.8 10.4V7a3.2 3.2 0 0 1 6.4 0v3.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <BagCount initial={bagCount} />
          </Link>
        </div>
      </div>
    </header>
  )
}
