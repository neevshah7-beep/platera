import type { Metadata } from 'next'
import { social } from '@/lib/seo/meta'
import Link from 'next/link'
import { Prose, Section } from '@/components/site/Prose'
import { MapEmbed } from '@/components/site/MapEmbed'
import { JsonLd, storeJsonLd } from '@/lib/seo/jsonld'
import { STORE, whatsappLink } from '@/lib/store'

export const metadata: Metadata = social({
  title: 'Jewellery Shop in Borivali West, Gorai 1',
  description:
    'Visit Platera Jewellers with Bhairav Jewellers in Gorai 1, Borivali West, Mumbai. Open 10 am to 2 pm and 4 pm to 9 pm. Hallmarked 925 silver jewellery.',
  alternates: { canonical: '/visit' },
})

export default function VisitPage() {
  const a = STORE.address
  return (
    <>
      <JsonLd data={storeJsonLd()} />
      <Prose
        title="Visit the store"
        intro="Platera’s pieces are kept at Bhairav Jewellers in Gorai 1, Borivali West. Come and hold them before you decide."
      >
        <Section title="Where">
          <address className="not-italic text-ink">
            {a.line1}
            <br />
            {a.line2}, {a.city} {a.postalCode}
          </address>
          <MapEmbed />
        </Section>
        <Section title="When">
          <p className="num text-ink">{STORE.hoursText}</p>
          <p>The store closes for the afternoon between the two sittings. To be sure the pieces you want are set aside, <Link href="/appointment?kind=store" className="link text-ink">book a time</Link>.</p>
        </Section>
        <Section title="Who you’re buying from">
          <p>
            Platera is a curated house. We don’t make jewellery; we choose it. Every piece is selected for its quality, craftsmanship and design,
            and presented online in collaboration with Bhairav Jewellers in Gorai 1.
          </p>
          <p>
            For you that means a real counter behind every order: a place you can walk into, a number that is answered, and an invoice from{' '}
            {STORE.legalName} with its GSTIN on it.
          </p>
        </Section>
        <Section title="Talk to us">
          <p>
            Call <a className="link num text-ink" href={`tel:${STORE.phoneE164}`}>{STORE.phoneDisplay}</a> or{' '}
            <a className="link text-ink" href={whatsappLink('Hello Platera, I’d like to visit the store.')}>message us on WhatsApp</a> during store hours.
          </p>
        </Section>
      </Prose>
    </>
  )
}
