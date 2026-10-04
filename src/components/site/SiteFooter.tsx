import Link from 'next/link'
import { MetalRule } from '@/components/metal/LightSource'
import { STORE, whatsappLink } from '@/lib/store'
import type { RateSnapshot } from '@/lib/pricing/types'
import { RateNote } from './RateNote'

const POLICIES = [
  { href: '/policies/shipping', label: 'Shipping and insurance' },
  { href: '/policies/returns', label: 'Returns and refunds' },
  { href: '/policies/buyback', label: 'Buyback and exchange' },
  { href: '/policies/cancellation', label: 'Cancellation' },
  { href: '/policies/payments', label: 'Payments' },
  { href: '/policies/privacy', label: 'Privacy' },
  { href: '/policies/terms', label: 'Terms of sale' },
]

export function SiteFooter({ rate }: { rate?: RateSnapshot }) {
  const a = STORE.address
  return (
    <footer className="ground-solid">
      <MetalRule />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-step-4">Platera</p>
          <p className="mt-3 max-w-sm text-ink-muted">{STORE.collaboration}.</p>
          <RateNote rate={rate} className="mt-6" />
          <Link href="/silver-rate-today" className="link mt-2 inline-block text-step--1 text-ink-muted">
            Today’s silver rate in Mumbai
          </Link>
        </div>

        <address className="not-italic md:col-span-3">
          <h2 className="font-sans text-step--1 font-medium text-ink-muted">The store</h2>
          <p className="mt-3">
            {a.line1}
            <br />
            {a.line2}
            <br />
            {a.city} {a.postalCode}
          </p>
          <p className="num mt-3">{STORE.hoursText}</p>
          <p className="mt-3 space-x-4">
            <a className="link num" href={`tel:${STORE.phoneE164}`}>{STORE.phoneDisplay}</a>
            <a className="link" href={whatsappLink('Hello Platera, I have a question.')}>WhatsApp</a>
          </p>
          <a className="link mt-3 inline-block text-step--1 text-ink-muted" href={STORE.mapsUrl} rel="noopener" target="_blank">
            Open in Google Maps
          </a>
        </address>

        <nav aria-label="Policies" className="md:col-span-4">
          <h2 className="font-sans text-step--1 font-medium text-ink-muted">Before you buy</h2>
          <ul className="mt-3 grid gap-2">
            {POLICIES.map((p) => (
              <li key={p.href}>
                <Link className="hover:text-argent" href={p.href}>{p.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-rule px-[var(--gutter)] py-6 text-step--1 text-ink-muted md:flex-row md:justify-between">
        <p>
          Sold and invoiced by {STORE.legalName} · <span className="num">GSTIN {STORE.gstin}</span>
        </p>
        <p>Prepaid orders only: UPI, cards and net banking.</p>
      </div>
    </footer>
  )
}
