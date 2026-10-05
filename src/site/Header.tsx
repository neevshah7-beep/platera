import Link from 'next/link'
import { MobileMenu } from '@/components/site/MobileMenu'

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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link-underline">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-6 text-step--1 tracking-[0.08em] uppercase">
          <Link href="/visit" className="link-underline hidden sm:inline">Visit</Link>
          <span className="md:hidden"><MobileMenu /></span>
          <Link href="/bag" className="link-underline">
            Bag<span className="num ml-1.5">({bagCount})</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
